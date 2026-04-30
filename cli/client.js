// HyperAgent client — typed helpers for cross-repo calls into HyperCode V2.4.
//
// Phase 3 export: awardFromCourse() — Course → V2.4 token sync.
// SECURITY: COURSE_SYNC_SECRET is server-only. This module refuses to run
// in a browser environment.

const SERVER_LIMITS = {
  tokensMin: 1,
  tokensMax: 10_000,
  discordIdMax: 32,
  sourceIdMax: 128,
  reasonMax: 255,
};

const DEFAULT_TIMEOUT_MS = 5000;

class AwardFromCourseError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message);
    this.name = 'AwardFromCourseError';
    if (status !== undefined) this.status = status;
    if (code !== undefined) this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

function assertServerOnly() {
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    throw new AwardFromCourseError(
      'awardFromCourse() must run server-side only — COURSE_SYNC_SECRET must never reach the browser',
      { code: 'BROWSER_FORBIDDEN' },
    );
  }
}

function validateInput(input) {
  if (!input || typeof input !== 'object') {
    throw new AwardFromCourseError('input is required', { code: 'INVALID_INPUT' });
  }

  const { sourceId, discordId, tokens, reason } = input;

  if (typeof sourceId !== 'string' || sourceId.length === 0) {
    throw new AwardFromCourseError('sourceId must be a non-empty string', { code: 'INVALID_SOURCE_ID' });
  }
  if (sourceId.length > SERVER_LIMITS.sourceIdMax) {
    throw new AwardFromCourseError(
      `sourceId must be ≤ ${SERVER_LIMITS.sourceIdMax} chars`,
      { code: 'INVALID_SOURCE_ID' },
    );
  }

  if (typeof discordId !== 'string' || discordId.length === 0) {
    throw new AwardFromCourseError('discordId must be a non-empty string', { code: 'INVALID_DISCORD_ID' });
  }
  if (discordId.length > SERVER_LIMITS.discordIdMax) {
    throw new AwardFromCourseError(
      `discordId must be ≤ ${SERVER_LIMITS.discordIdMax} chars`,
      { code: 'INVALID_DISCORD_ID' },
    );
  }

  if (!Number.isInteger(tokens)) {
    throw new AwardFromCourseError('tokens must be an integer', { code: 'INVALID_TOKENS' });
  }
  if (tokens < SERVER_LIMITS.tokensMin || tokens > SERVER_LIMITS.tokensMax) {
    throw new AwardFromCourseError(
      `tokens must be between ${SERVER_LIMITS.tokensMin} and ${SERVER_LIMITS.tokensMax}`,
      { code: 'INVALID_TOKENS' },
    );
  }

  if (reason !== undefined) {
    if (typeof reason !== 'string') {
      throw new AwardFromCourseError('reason must be a string when provided', { code: 'INVALID_REASON' });
    }
    if (reason.length > SERVER_LIMITS.reasonMax) {
      throw new AwardFromCourseError(
        `reason must be ≤ ${SERVER_LIMITS.reasonMax} chars`,
        { code: 'INVALID_REASON' },
      );
    }
  }
}

/**
 * Award BROski$ tokens from the Course repo to a HyperCode V2.4 user.
 *
 * Server-only — never call from a browser bundle (COURSE_SYNC_SECRET would leak).
 * Idempotent via sourceId: replaying the same sourceId returns 409 (no double award).
 *
 * @param {object} input
 * @param {string} input.sourceId  - Idempotency key (e.g. token_transactions.id), ≤128 chars
 * @param {string} input.discordId - Cross-repo identity key, ≤32 chars (Discord snowflake)
 * @param {number} input.tokens    - Integer, 1..10000
 * @param {string} [input.reason]  - Human-readable reason, ≤255 chars
 * @param {object} [options]
 * @param {string} [options.baseUrl]   - Defaults to process.env.HYPERCODE_API_URL or http://localhost:8000
 * @param {string} [options.secret]    - Defaults to process.env.COURSE_SYNC_SECRET
 * @param {number} [options.timeoutMs] - Request timeout, default 5000
 * @param {typeof fetch} [options.fetch] - Custom fetch (used by tests)
 * @returns {Promise<object>} Response body (always includes source_id). On 409, returns {source_id, duplicate: true}.
 * @throws {AwardFromCourseError} on validation failure, missing secret, timeout, or non-200/409 response
 */
async function awardFromCourse(input, options = {}) {
  assertServerOnly();
  validateInput(input);

  const baseUrl   = options.baseUrl   || process.env.HYPERCODE_API_URL || 'http://localhost:8000';
  const secret    = options.secret    || process.env.COURSE_SYNC_SECRET;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetch     || globalThis.fetch;

  if (!secret) {
    throw new AwardFromCourseError(
      'COURSE_SYNC_SECRET is required (pass options.secret or set env)',
      { code: 'MISSING_SECRET' },
    );
  }
  if (typeof fetchImpl !== 'function') {
    throw new AwardFromCourseError(
      'fetch is not available — Node 18+ required, or pass options.fetch',
      { code: 'NO_FETCH' },
    );
  }

  const url = `${baseUrl.replace(/\/$/, '')}/api/v1/economy/award-from-course`;
  const body = JSON.stringify({
    source_id: input.sourceId,
    discord_id: input.discordId,
    tokens: input.tokens,
    reason: input.reason ?? 'Course reward',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Secret': secret,
      },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    if (err && (err.name === 'AbortError' || err.code === 'ABORT_ERR')) {
      throw new AwardFromCourseError(`Request timed out after ${timeoutMs}ms`, { code: 'TIMEOUT', cause: err });
    }
    throw new AwardFromCourseError(`Network error: ${err.message}`, { code: 'NETWORK', cause: err });
  } finally {
    clearTimeout(timer);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    // server responded without parseable JSON — fall through to status handling
  }

  if (res.status === 200) {
    return { ...(json || {}), source_id: input.sourceId };
  }

  if (res.status === 409) {
    return { source_id: input.sourceId, duplicate: true, ...(json || {}) };
  }

  const detail = (json && (json.detail || json.message)) || res.statusText || 'unknown error';
  throw new AwardFromCourseError(
    `award-from-course failed: ${res.status} ${detail}`,
    { status: res.status, code: 'BAD_STATUS' },
  );
}

module.exports = { awardFromCourse, AwardFromCourseError };
