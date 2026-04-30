// Tests for cli/commands/init.js — scaffold from templates.
// Run: node --test tests/init.test.js

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs   = require('node:fs');
const os   = require('node:os');
const path = require('node:path');

const { validateAgent } = require('../cli/validate');

const CLI = path.join(__dirname, '..', 'cli', 'index.js');

function runInit(args, cwd) {
  return execFileSync('node', [CLI, 'init', ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'hyper-init-test-'));
}

describe('init — template scaffolding', () => {
  test('scaffolds python template into a new dir', () => {
    const work = tmpdir();
    runInit(['my-py-bot', '--template', 'python'], work);

    const target = path.join(work, 'my-py-bot');
    assert.ok(fs.existsSync(path.join(target, 'manifest.json')));
    assert.ok(fs.existsSync(path.join(target, 'main.py')));
    assert.ok(fs.existsSync(path.join(target, 'requirements.txt')));

    const result = validateAgent(target);
    assert.equal(result.passed, true);
    assert.equal(result.manifest.name, 'my-py-bot');
    assert.equal(result.manifest.runtime, 'python');

    fs.rmSync(work, { recursive: true, force: true });
  });

  test('scaffolds typescript template with tsconfig + src/index.ts', () => {
    const work = tmpdir();
    runInit(['my-ts-bot', '--template', 'typescript'], work);

    const target = path.join(work, 'my-ts-bot');
    assert.ok(fs.existsSync(path.join(target, 'tsconfig.json')));
    assert.ok(fs.existsSync(path.join(target, 'src', 'index.ts')));

    const result = validateAgent(target);
    assert.equal(result.passed, true);
    assert.equal(result.manifest.name, 'my-ts-bot');

    const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'my-ts-bot');

    fs.rmSync(work, { recursive: true, force: true });
  });

  test('scaffolds mcp template with port 3200 + mcp_compatible', () => {
    const work = tmpdir();
    runInit(['my-mcp-bot', '--template', 'mcp'], work);

    const target = path.join(work, 'my-mcp-bot');
    const result = validateAgent(target);
    assert.equal(result.passed, true);
    assert.equal(result.manifest.mcp_compatible, true);
    assert.equal(result.manifest.port, 3200);
    assert.equal(result.manifest.name, 'my-mcp-bot');

    fs.rmSync(work, { recursive: true, force: true });
  });

  test('rejects unknown template', () => {
    const work = tmpdir();
    assert.throws(() => runInit(['x', '--template', 'rust'], work));
    fs.rmSync(work, { recursive: true, force: true });
  });

  test('rejects missing --template flag', () => {
    const work = tmpdir();
    assert.throws(() => runInit(['x'], work));
    fs.rmSync(work, { recursive: true, force: true });
  });

  test('rejects non-kebab-case agent name', () => {
    const work = tmpdir();
    assert.throws(() => runInit(['BadName_!', '--template', 'node'], work));
    fs.rmSync(work, { recursive: true, force: true });
  });

  test('refuses to scaffold into a non-empty dir', () => {
    const work = tmpdir();
    const target = path.join(work, 'taken');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'existing.txt'), 'x');
    assert.throws(() => runInit(['taken', '--template', 'node'], work));
    fs.rmSync(work, { recursive: true, force: true });
  });
});
