// Unit tests for cli/validate.js — uses Node's built-in test runner (Node 18+)
// Run: node --test tests/validate.test.js

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('node:fs');
const os     = require('node:os');
const path   = require('node:path');

const { validateAgent } = require('../cli/validate');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Write a manifest.json into a temp dir and return the dir path. */
function makeTempAgent(manifest) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hyper-agent-test-'));
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  return dir;
}

/** Remove a temp directory tree after the test. */
function rmTemp(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ─── Minimal valid manifest fixture ──────────────────────────────────────────

const VALID_MANIFEST = {
  name: 'test-agent',
  version: '0.1.0',
  runtime: 'node',
  entrypoint: 'index.js',
  tools: [
    {
      name: 'hello_world',
      description: 'A simple greeting tool',
      input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    },
  ],
  mcp_compatible: false,
};

// ─── Schema validation tests ──────────────────────────────────────────────────

describe('validateAgent — schema validation', () => {
  test('passes for a valid minimal manifest', () => {
    const dir    = makeTempAgent(VALID_MANIFEST);
    const result = validateAgent(dir);
    rmTemp(dir);
    assert.equal(result.passed, true);
    assert.equal(result.strictErrors, 0);
    assert.equal(result.manifest.name, 'test-agent');
  });

  test('passes with all optional fields set', () => {
    const manifest = {
      ...VALID_MANIFEST,
      display_name: 'Test Agent',
      description: 'Full-featured test agent',
      author: 'broski-test',
      memory: 'redis',
      env_vars: ['REDIS_URL'],
      tags: ['test', 'node'],
      course_level: 3,
      badges: ['featured'],
    };
    const dir    = makeTempAgent(manifest);
    const result = validateAgent(dir);
    rmTemp(dir);
    assert.equal(result.passed, true);
    assert.equal(result.manifest.memory, 'redis');
    assert.equal(result.manifest.course_level, 3);
  });

  test('passes for MCP-compatible agent with valid port', () => {
    const manifest = { ...VALID_MANIFEST, mcp_compatible: true, port: 3200 };
    const dir      = makeTempAgent(manifest);
    const result   = validateAgent(dir);
    rmTemp(dir);
    assert.equal(result.passed, true);
  });

  test('fails when required field "name" is missing', () => {
    const { name: _n, ...noName } = VALID_MANIFEST;
    const dir    = makeTempAgent(noName);
    const result = validateAgent(dir);
    rmTemp(dir);
    assert.equal(result.passed, false);
  });

  test('fails when required field "tools" is empty array', () => {
    const manifest = { ...VALID_MANIFEST, tools: [] };
    const dir      = makeTempAgent(manifest);
    const result   = validateAgent(dir);
    rmTemp(dir);
    assert.equal(result.passed, false);
  });

  test('fails when runtime is not an allowed enum value', () => {
    const manifest = { ...VALID_MANIFEST, runtime: 'ruby' };
    const dir      = makeTempAgent(manifest);
    const result   = validateAgent(dir);
    rmTemp(dir);
    assert.equal(result.passed, false);
  });

  test('fails when name does not match kebab-case pattern', () => {
    const manifest = { ...VALID_MANIFEST, name: 'BadName_!' };
    const dir      = makeTempAgent(manifest);
    const result   = validateAgent(dir);
    rmTemp(dir);
    assert.equal(result.passed, false);
  });

  test('fails when version is not semver', () => {
    const manifest = { ...VALID_MANIFEST, version: 'v1' };
    const dir      = makeTempAgent(manifest);
    const result   = validateAgent(dir);
    rmTemp(dir);
    assert.equal(result.passed, false);
  });

  test('fails when mcp_compatible is true but port is missing', () => {
    const manifest = { ...VALID_MANIFEST, mcp_compatible: true };
    const dir      = makeTempAgent(manifest);
    const result   = validateAgent(dir);
    rmTemp(dir);
    assert.equal(result.passed, false);
  });

  test('fails when port is out of 3100-3999 range', () => {
    const manifest = { ...VALID_MANIFEST, mcp_compatible: true, port: 9999 };
    const dir      = makeTempAgent(manifest);
    const result   = validateAgent(dir);
    rmTemp(dir);
    assert.equal(result.passed, false);
  });

  test('fails when manifest.json is absent', () => {
    const dir    = fs.mkdtempSync(path.join(os.tmpdir(), 'hyper-agent-test-'));
    const result = validateAgent(dir);
    rmTemp(dir);
    assert.equal(result.passed, false);
  });

  test('fails when manifest.json is invalid JSON', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hyper-agent-test-'));
    fs.writeFileSync(path.join(dir, 'manifest.json'), '{ bad json !!');
    const result = validateAgent(dir);
    rmTemp(dir);
    assert.equal(result.passed, false);
  });
});

// ─── Strict mode tests ────────────────────────────────────────────────────────

describe('validateAgent — strict mode', () => {
  test('reports strictErrors when entrypoint file is missing', () => {
    const dir    = makeTempAgent(VALID_MANIFEST); // no index.js written
    const result = validateAgent(dir, { strict: true });
    rmTemp(dir);
    assert.equal(result.passed, true);   // schema is valid
    assert.ok(result.strictErrors > 0);  // strict check catches missing entrypoint
  });

  test('reports 0 strictErrors when entrypoint file exists', () => {
    const dir = makeTempAgent(VALID_MANIFEST);
    fs.writeFileSync(path.join(dir, 'index.js'), '// stub');
    const result = validateAgent(dir, { strict: true });
    rmTemp(dir);
    assert.equal(result.passed, true);
    assert.equal(result.strictErrors, 0);
  });

  test('detects MCP port conflict when same port used twice', () => {
    const seenPorts = new Map();
    const portManifest = { ...VALID_MANIFEST, mcp_compatible: true, port: 3300 };

    const dir1    = makeTempAgent(portManifest);
    fs.writeFileSync(path.join(dir1, 'index.js'), '// stub');
    const result1 = validateAgent(dir1, { strict: true, seenPorts });
    rmTemp(dir1);

    const dir2    = makeTempAgent(portManifest);
    fs.writeFileSync(path.join(dir2, 'index.js'), '// stub');
    const result2 = validateAgent(dir2, { strict: true, seenPorts });
    rmTemp(dir2);

    assert.equal(result1.strictErrors, 0);
    assert.ok(result2.strictErrors > 0, 'second agent on same port should fail strict check');
  });
});

// ─── Template fixtures ────────────────────────────────────────────────────────

describe('built-in templates', () => {
  const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

  test('node-starter template is valid', () => {
    const result = validateAgent(path.join(TEMPLATES_DIR, 'node-starter'));
    assert.equal(result.passed, true, 'node-starter manifest should be valid');
  });

  test('python-starter template is valid', () => {
    const result = validateAgent(path.join(TEMPLATES_DIR, 'python-starter'));
    assert.equal(result.passed, true, 'python-starter manifest should be valid');
  });
});
