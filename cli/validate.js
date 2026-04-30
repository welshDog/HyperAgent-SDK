#!/usr/bin/env node
// hyper-agent validate — validates manifest.json against hyper-agent-spec.json
// Supports --strict for deep runtime checks

const fs   = require('fs');
const path = require('path');
const Ajv  = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const SPEC_PATH = path.join(__dirname, '..', 'hyper-agent-spec.json');
const spec      = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8'));
const validate  = ajv.compile(spec);

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

// ─── AJV → human hint mapping ─────────────────────────────────────────────────

const HINTS = {
  '/name': "must be kebab-case (3-50 chars, e.g. 'my-cool-agent')",
  '/version': "must be semver (e.g. '0.1.0', not 'v1' or '1.0')",
  '/runtime': "must be one of: python | node | deno",
  '/mcp_compatible': "must be a boolean (true/false)",
  '/port': "must be an integer in range 3100-3999 (writing/code/data/discord/automation)",
  '/memory': "must be one of: none | redis | postgres",
  '/course_level': "must be an integer 1-5 (1=HyperNewbie, 5=BROski Elite)",
};

function humanError(err) {
  const ip = err.instancePath || '(root)';
  const directHint = HINTS[ip];
  if (directHint) return `${ip}: ${directHint}`;

  // Tools array: /tools/0/name etc.
  if (ip.startsWith('/tools/')) {
    const segs = ip.split('/');
    const idx = segs[2];
    const field = segs[3];
    if (field === 'name') return `tools[${idx}].name: must be snake_case (3-64 chars, e.g. 'fetch_data')`;
    if (field === 'description') return `tools[${idx}].description: max 300 chars`;
    if (!field) return `tools[${idx}]: ${err.message}`;
    return `tools[${idx}].${field}: ${err.message}`;
  }

  // Missing required prop
  if (err.keyword === 'required') {
    return `${ip || '(root)'}: missing required field '${err.params.missingProperty}'`;
  }

  // mcp_compatible:true but no port
  if (err.keyword === 'if' || (err.schemaPath && err.schemaPath.includes('then/required'))) {
    return `port is required when mcp_compatible:true (use 3100-3999)`;
  }

  // Additional properties not allowed
  if (err.keyword === 'additionalProperties') {
    return `${ip || '(root)'}: unknown field '${err.params.additionalProperty}' (check spelling)`;
  }

  return `${ip}: ${err.message}`;
}

// ─── Strict checks ────────────────────────────────────────────────────────────

function parseEnvFile(agentDir) {
  const envPath = path.join(agentDir, '.env');
  if (!fs.existsSync(envPath)) return {};
  const vars = {};
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq > 0) vars[trimmed.slice(0, eq).trim()] = true;
  });
  return vars;
}

function strictChecks(agentDir, manifest, seenPorts) {
  const issues = [];

  // 1. Entrypoint file exists on disk
  const epPath = path.join(agentDir, manifest.entrypoint);
  if (!fs.existsSync(epPath)) {
    issues.push({ level: 'error', msg: `entrypoint '${manifest.entrypoint}' not found on disk` });
  } else {
    issues.push({ level: 'ok', msg: `entrypoint '${manifest.entrypoint}' found` });
  }

  // 2. Runtime sanity — expected file exists
  const runtimeFiles = { node: 'package.json', python: 'requirements.txt', deno: 'deno.json' };
  const runtimeFile  = runtimeFiles[manifest.runtime];
  if (runtimeFile) {
    const runtimePath = path.join(agentDir, runtimeFile);
    if (!fs.existsSync(runtimePath)) {
      issues.push({ level: 'warn', msg: `runtime '${manifest.runtime}' but no ${runtimeFile} found` });
    } else {
      issues.push({ level: 'ok', msg: `runtime file '${runtimeFile}' found` });
    }
  }

  // 3. env_vars injection simulation
  if (manifest.env_vars && manifest.env_vars.length > 0) {
    const envFileVars = parseEnvFile(agentDir);
    const missing = [];
    const found   = [];
    manifest.env_vars.forEach(v => {
      (process.env[v] || envFileVars[v] ? found : missing).push(v);
    });
    found.forEach(v =>
      issues.push({ level: 'ok', msg: `env_var '${v}' present` })
    );
    missing.forEach(v =>
      issues.push({ level: 'warn', msg: `env_var '${v}' not set (not in process.env or .env)` })
    );
  } else {
    issues.push({ level: 'ok', msg: 'env_vars: none declared' });
  }

  // 4. MCP port conflict detection (shared seenPorts Map across agents)
  if (manifest.mcp_compatible && manifest.port) {
    if (seenPorts.has(manifest.port)) {
      issues.push({
        level: 'error',
        msg:   `port ${manifest.port} conflicts with agent '${seenPorts.get(manifest.port)}'`
      });
    } else {
      seenPorts.set(manifest.port, manifest.name);
      issues.push({ level: 'ok', msg: `port ${manifest.port} — no conflicts` });
    }
  }

  return issues;
}

// ─── Single agent validation ──────────────────────────────────────────────────

/**
 * Validate a single agent directory against the HyperAgent spec.
 *
 * @param {string} agentDir - Path to the agent directory (must contain `manifest.json`).
 * @param {object} [options]
 * @param {boolean} [options.strict=false] - Enable strict mode: checks entrypoint
 *   file exists on disk, runtime file present, env vars set, MCP port conflicts.
 * @param {Map<number,string>} [options.seenPorts] - Shared port-conflict map.
 *   Pass the same Map across multiple calls to detect cross-agent port conflicts.
 * @returns {{ passed: boolean, strictErrors: number, manifest?: object }}
 *   `passed` is true when the manifest is schema-valid.
 *   `strictErrors` counts strict-mode failures (0 when strict is false).
 *   `manifest` is the parsed manifest when `passed` is true.
 */
function validateAgent(agentDir, { strict = false, seenPorts = new Map() } = {}) {
  const manifestPath = path.join(agentDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.log(`${RED}✗ ${path.basename(agentDir)} — no manifest.json found${RESET}`);
    return { passed: false, strictErrors: 0 };
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    console.log(`${RED}✗ ${path.basename(agentDir)} — invalid JSON in manifest.json${RESET}`);
    return { passed: false, strictErrors: 0 };
  }

  const valid = validate(manifest);

  if (!valid) {
    console.log(`${RED}✗ ${manifest.name || path.basename(agentDir)} — INVALID manifest${RESET}`);
    const seen = new Set();
    validate.errors.forEach(err => {
      const msg = humanError(err);
      if (seen.has(msg)) return;
      seen.add(msg);
      console.log(`  ${YELLOW}→ ${msg}${RESET}`);
    });
    console.log(`  ${DIM}Spec: hyper-agent-spec.json — see github.com/welshDog/HyperAgent-SDK${RESET}`);
    return { passed: false, strictErrors: 0 };
  }

  const tools  = manifest.tools?.length || 0;
  const mcpStr = manifest.mcp_compatible ? `${GREEN}mcp: ✓${RESET}` : `${DIM}mcp: ✗${RESET}`;
  const memStr = manifest.memory && manifest.memory !== 'none'
    ? ` ${CYAN}mem: ${manifest.memory}${RESET}`
    : '';
  console.log(`${GREEN}✓ ${manifest.name} v${manifest.version}${RESET} — ${tools} tool(s), ${manifest.runtime}, ${mcpStr}${memStr}`);

  if (!strict) return { passed: true, strictErrors: 0, manifest };

  // Run strict checks
  const issues = strictChecks(agentDir, manifest, seenPorts);
  let strictErrors = 0;

  issues.forEach(({ level, msg }) => {
    if (level === 'ok') {
      console.log(`  ${DIM}[STRICT]${RESET} ${GREEN}✓${RESET} ${msg}`);
    } else if (level === 'warn') {
      console.log(`  ${DIM}[STRICT]${RESET} ${YELLOW}⚠${RESET} ${msg}`);
    } else {
      console.log(`  ${DIM}[STRICT]${RESET} ${RED}✗${RESET} ${msg}`);
      strictErrors++;
    }
  });

  return { passed: true, strictErrors, manifest };
}

// ─── CLI runner ───────────────────────────────────────────────────────────────

/**
 * CLI entry point for the `validate` command.
 *
 * @param {string[]} args - Arguments after `hyper-agent validate`,
 *   e.g. `['./my-agent', '--strict']`.
 */
function run(args) {
  const strict    = args.includes('--strict');
  const pathArgs  = args.filter(a => !a.startsWith('--'));
  const targetArg = pathArgs[0];

  if (!targetArg) {
    console.log(`${BOLD}Usage:${RESET}`);
    console.log('  hyper-agent validate <agent-dir> [--strict]');
    console.log('  hyper-agent validate .agents/     [--strict]');
    if (strict) console.log(`\n${CYAN}--strict${RESET}: checks entrypoint, env_vars, runtime files, MCP port conflicts`);
    process.exit(1);
  }

  const target = path.resolve(targetArg);

  if (!fs.existsSync(target)) {
    console.log(`${RED}✗ Path not found: ${target}${RESET}`);
    process.exit(1);
  }

  if (strict) {
    console.log(`${CYAN}◆ Strict mode enabled — runtime + env checks active${RESET}\n`);
  }

  const stat      = fs.statSync(target);
  const seenPorts = new Map();
  let passed = 0, failed = 0, strictFailed = 0;

  if (stat.isDirectory()) {
    if (fs.existsSync(path.join(target, 'manifest.json'))) {
      // Single agent dir
      const result = validateAgent(target, { strict, seenPorts });
      result.passed ? passed++ : failed++;
      strictFailed += result.strictErrors || 0;
    } else {
      // Folder of agents
      const entries  = fs.readdirSync(target, { withFileTypes: true });
      const agentDirs = entries.filter(e => e.isDirectory()).map(e => path.join(target, e.name));

      if (agentDirs.length === 0) {
        console.log(`${YELLOW}⚠ No agent subdirectories found in ${target}${RESET}`);
        process.exit(0);
      }

      console.log(`${BOLD}Scanning ${agentDirs.length} agent(s) in ${path.basename(target)}/...${RESET}\n`);
      agentDirs.forEach(dir => {
        const result = validateAgent(dir, { strict, seenPorts });
        result.passed ? passed++ : failed++;
        strictFailed += result.strictErrors || 0;
        if (strict) console.log(); // spacing between agents
      });
    }
  }

  // Summary
  console.log(`\n${BOLD}Results: ${GREEN}${passed} passed${RESET}${BOLD}, ${failed > 0 ? RED : ''}${failed} failed${RESET}`);

  if (strict && strictFailed > 0) {
    console.log(`${YELLOW}⚠ ${strictFailed} strict error(s) — fix before graduating${RESET}`);
  }

  if (passed === 0 && failed > 0) {
    console.log(`${YELLOW}\nBuild at least 1 valid agent before running npm run graduate${RESET}`);
    process.exit(1);
  }

  process.exit(failed > 0 || strictFailed > 0 ? 1 : 0);
}

// Allow direct invocation (e.g. npm test calls node cli/validate.js directly)
if (require.main === module) {
  run(process.argv.slice(2));
}

module.exports = { run, validateAgent };
