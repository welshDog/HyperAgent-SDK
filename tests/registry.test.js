// Unit tests for cli/registry.js badge computation — Node 18+ built-in test runner
// Run: node --test tests/registry.test.js

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { computeBadges, BADGE_RULES } = require('../cli/registry');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal valid manifest base — no auto-badges triggered. */
const BASE = {
  name: 'test-agent',
  version: '0.1.0',
  runtime: 'node',
  entrypoint: 'index.js',
  tools: [{ name: 'tool_one', description: 'A tool', input_schema: {} }],
  mcp_compatible: false,
  memory: 'none',
};

// ─── Badge rule coverage ──────────────────────────────────────────────────────

describe('computeBadges — auto-computed badges', () => {
  test('no badges for minimal manifest', () => {
    const badges = computeBadges(BASE);
    assert.deepEqual(badges, []);
  });

  test('mcp-ready badge when mcp_compatible is true', () => {
    const badges = computeBadges({ ...BASE, mcp_compatible: true, port: 3200 });
    assert.ok(badges.includes('mcp-ready'));
  });

  test('memory-enabled badge when memory is redis', () => {
    const badges = computeBadges({ ...BASE, memory: 'redis' });
    assert.ok(badges.includes('memory-enabled'));
  });

  test('memory-enabled badge when memory is postgres', () => {
    const badges = computeBadges({ ...BASE, memory: 'postgres' });
    assert.ok(badges.includes('memory-enabled'));
  });

  test('no memory-enabled badge when memory is none', () => {
    const badges = computeBadges({ ...BASE, memory: 'none' });
    assert.ok(!badges.includes('memory-enabled'));
  });

  test('multi-tool badge when 3 or more tools declared', () => {
    const tools = [
      { name: 'tool_one',   description: 'A', input_schema: {} },
      { name: 'tool_two',   description: 'B', input_schema: {} },
      { name: 'tool_three', description: 'C', input_schema: {} },
    ];
    const badges = computeBadges({ ...BASE, tools });
    assert.ok(badges.includes('multi-tool'));
  });

  test('no multi-tool badge for fewer than 3 tools', () => {
    const badges = computeBadges(BASE); // 1 tool
    assert.ok(!badges.includes('multi-tool'));
  });

  test('env-declared badge when env_vars has at least one entry', () => {
    const badges = computeBadges({ ...BASE, env_vars: ['REDIS_URL'] });
    assert.ok(badges.includes('env-declared'));
  });

  test('hyper-coder badge when course_level >= 4', () => {
    const badges = computeBadges({ ...BASE, course_level: 4 });
    assert.ok(badges.includes('hyper-coder'));
  });

  test('elite badge when course_level >= 5', () => {
    const badges = computeBadges({ ...BASE, course_level: 5 });
    assert.ok(badges.includes('elite'));
    assert.ok(badges.includes('hyper-coder'));
  });

  test('no hyper-coder or elite for course_level < 4', () => {
    const badges = computeBadges({ ...BASE, course_level: 3 });
    assert.ok(!badges.includes('hyper-coder'));
    assert.ok(!badges.includes('elite'));
  });

  test('health-checked badge when health_check is set', () => {
    const badges = computeBadges({ ...BASE, health_check: '/health' });
    assert.ok(badges.includes('health-checked'));
  });

  test('web3-enabled badge when a web3 block is present', () => {
    const badges = computeBadges({
      ...BASE, web3: { chain: 'base-sepolia', capabilities: ['mint'] },
    });
    assert.ok(badges.includes('web3-enabled'));
  });

  test('no web3-enabled badge when web3 is absent', () => {
    const badges = computeBadges(BASE);
    assert.ok(!badges.includes('web3-enabled'));
  });

  test('dnft badge when web3.dnft is true', () => {
    const badges = computeBadges({
      ...BASE, web3: { chain: 'base', dnft: true, capabilities: ['mint', 'evolve'] },
    });
    assert.ok(badges.includes('dnft'));
    assert.ok(badges.includes('web3-enabled'));
  });

  test('no dnft badge when web3 present but dnft not true', () => {
    const badges = computeBadges({
      ...BASE, web3: { chain: 'base', capabilities: ['read-balance'] },
    });
    assert.ok(badges.includes('web3-enabled'));
    assert.ok(!badges.includes('dnft'));
  });
});

describe('computeBadges — verified flag', () => {
  test('verified badge prepended when verified=true', () => {
    const badges = computeBadges(BASE, true);
    assert.equal(badges[0], 'verified');
  });

  test('no verified badge when verified=false (default)', () => {
    const badges = computeBadges(BASE, false);
    assert.ok(!badges.includes('verified'));
  });
});

describe('computeBadges — self-declared badges', () => {
  test('includes self-declared badges not already auto-computed', () => {
    const badges = computeBadges({ ...BASE, badges: ['featured', 'community-pick'] });
    assert.ok(badges.includes('featured'));
    assert.ok(badges.includes('community-pick'));
  });

  test('deduplicates self-declared badges that match auto-computed', () => {
    // memory-enabled is both auto-computed and self-declared
    const manifest = { ...BASE, memory: 'redis', badges: ['memory-enabled'] };
    const badges   = computeBadges(manifest);
    const count    = badges.filter(b => b === 'memory-enabled').length;
    assert.equal(count, 1, 'memory-enabled should appear exactly once');
  });
});

describe('BADGE_RULES shape', () => {
  test('every rule has id, label, and test function', () => {
    for (const rule of BADGE_RULES) {
      assert.ok(typeof rule.id    === 'string',   `rule.id must be a string`);
      assert.ok(typeof rule.label === 'string',   `rule.label must be a string`);
      assert.ok(typeof rule.test  === 'function', `rule.test must be a function`);
    }
  });
});
