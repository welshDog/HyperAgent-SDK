// Tests for cli/client.js — awardFromCourse() Course → V2.4 token sync.
// Uses a local http server so we test the real fetch path, headers, and JSON body.

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http   = require('node:http');

const { awardFromCourse, AwardFromCourseError } = require('../cli/client');

// ─── Mock V2.4 server ────────────────────────────────────────────────────────

let server;
let serverUrl;
let lastRequest = null;
/** @type {(req, body) => {status:number, body?:any}} */
let handler = () => ({ status: 200, body: { awarded: true, coins_balance: 100, xp_balance: 50, level: 2, source_id: 'override-me' } });

function startServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch {}
        lastRequest = { url: req.url, method: req.method, headers: req.headers, body: parsed };
        const { status, body, delayMs } = handler(req, parsed) || {};
        const send = () => {
          res.statusCode = status ?? 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body ?? {}));
        };
        if (delayMs) setTimeout(send, delayMs); else send();
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      serverUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

before(startServer);
after(() => new Promise((r) => server.close(r)));

const SECRET = 'test-secret';
const VALID = { sourceId: 'src-1', discordId: '123456789012345678', tokens: 50, reason: 'test' };

// ─── Happy paths ──────────────────────────────────────────────────────────────

describe('awardFromCourse — happy paths', () => {
  test('200 returns merged body with source_id', async () => {
    handler = () => ({ status: 200, body: { awarded: true, coins_balance: 200, xp_balance: 75, level: 3, source_id: 'src-1' } });
    const res = await awardFromCourse(VALID, { baseUrl: serverUrl, secret: SECRET });
    assert.equal(res.source_id, 'src-1');
    assert.equal(res.awarded, true);
    assert.equal(res.coins_balance, 200);
    assert.equal(res.duplicate, undefined);
  });

  test('sends X-Sync-Secret header and correct JSON body', async () => {
    handler = () => ({ status: 200, body: { awarded: true } });
    await awardFromCourse(VALID, { baseUrl: serverUrl, secret: SECRET });
    assert.equal(lastRequest.method, 'POST');
    assert.equal(lastRequest.url, '/api/v1/economy/award-from-course');
    assert.equal(lastRequest.headers['x-sync-secret'], SECRET);
    assert.equal(lastRequest.headers['content-type'], 'application/json');
    assert.deepEqual(lastRequest.body, {
      source_id: 'src-1',
      discord_id: '123456789012345678',
      tokens: 50,
      reason: 'test',
    });
  });

  test('defaults reason to "Course reward" when omitted', async () => {
    handler = () => ({ status: 200, body: { awarded: true } });
    const { reason: _r, ...noReason } = VALID;
    await awardFromCourse(noReason, { baseUrl: serverUrl, secret: SECRET });
    assert.equal(lastRequest.body.reason, 'Course reward');
  });

  test('409 returns {source_id, duplicate:true}', async () => {
    handler = () => ({ status: 409, body: { detail: "source_id 'src-1' already processed — no double award" } });
    const res = await awardFromCourse(VALID, { baseUrl: serverUrl, secret: SECRET });
    assert.equal(res.source_id, 'src-1');
    assert.equal(res.duplicate, true);
    assert.match(res.detail, /already processed/);
  });

  test('strips trailing slash from baseUrl', async () => {
    handler = () => ({ status: 200, body: { awarded: true } });
    await awardFromCourse(VALID, { baseUrl: serverUrl + '/', secret: SECRET });
    assert.equal(lastRequest.url, '/api/v1/economy/award-from-course');
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('awardFromCourse — input validation', () => {
  test('rejects tokens = 0', async () => {
    await assert.rejects(
      () => awardFromCourse({ ...VALID, tokens: 0 }, { baseUrl: serverUrl, secret: SECRET }),
      (e) => e instanceof AwardFromCourseError && e.code === 'INVALID_TOKENS',
    );
  });

  test('rejects tokens > 10000', async () => {
    await assert.rejects(
      () => awardFromCourse({ ...VALID, tokens: 10_001 }, { baseUrl: serverUrl, secret: SECRET }),
      (e) => e.code === 'INVALID_TOKENS',
    );
  });

  test('rejects non-integer tokens', async () => {
    await assert.rejects(
      () => awardFromCourse({ ...VALID, tokens: 1.5 }, { baseUrl: serverUrl, secret: SECRET }),
      (e) => e.code === 'INVALID_TOKENS',
    );
  });

  test('rejects empty sourceId', async () => {
    await assert.rejects(
      () => awardFromCourse({ ...VALID, sourceId: '' }, { baseUrl: serverUrl, secret: SECRET }),
      (e) => e.code === 'INVALID_SOURCE_ID',
    );
  });

  test('rejects discordId longer than 32 chars', async () => {
    await assert.rejects(
      () => awardFromCourse({ ...VALID, discordId: 'x'.repeat(33) }, { baseUrl: serverUrl, secret: SECRET }),
      (e) => e.code === 'INVALID_DISCORD_ID',
    );
  });

  test('rejects missing secret', async () => {
    await assert.rejects(
      () => awardFromCourse(VALID, { baseUrl: serverUrl }),
      (e) => e.code === 'MISSING_SECRET',
    );
  });
});

// ─── Error paths ──────────────────────────────────────────────────────────────

describe('awardFromCourse — server errors', () => {
  test('throws AwardFromCourseError on 401', async () => {
    handler = () => ({ status: 401, body: { detail: 'Invalid sync secret' } });
    await assert.rejects(
      () => awardFromCourse(VALID, { baseUrl: serverUrl, secret: 'wrong' }),
      (e) => e instanceof AwardFromCourseError && e.status === 401 && e.code === 'BAD_STATUS',
    );
  });

  test('throws AwardFromCourseError on 500', async () => {
    handler = () => ({ status: 500, body: { detail: 'boom' } });
    await assert.rejects(
      () => awardFromCourse(VALID, { baseUrl: serverUrl, secret: SECRET }),
      (e) => e.status === 500,
    );
  });

  test('times out via AbortController', async () => {
    handler = () => ({ status: 200, body: { awarded: true }, delayMs: 200 });
    await assert.rejects(
      () => awardFromCourse(VALID, { baseUrl: serverUrl, secret: SECRET, timeoutMs: 30 }),
      (e) => e instanceof AwardFromCourseError && e.code === 'TIMEOUT',
    );
  });
});
