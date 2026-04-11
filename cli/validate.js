#!/usr/bin/env node
// hyper-agent validate — validates manifest.json against hyper-agent-spec.json

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const SPEC_PATH = path.join(__dirname, '..', 'hyper-agent-spec.json');
const spec = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8'));
const validate = ajv.compile(spec);

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function validateAgent(agentDir) {
  const manifestPath = path.join(agentDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.log(`${RED}✗ ${path.basename(agentDir)} — no manifest.json found${RESET}`);
    return false;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    console.log(`${RED}✗ ${path.basename(agentDir)} — invalid JSON in manifest.json${RESET}`);
    return false;
  }

  const valid = validate(manifest);

  if (valid) {
    const tools = manifest.tools?.length || 0;
    const mcp = manifest.mcp_compatible ? 'mcp: ✓' : 'mcp: ✗';
    console.log(`${GREEN}✓ ${manifest.name} v${manifest.version}${RESET} — ${tools} tool(s), ${manifest.runtime}, ${mcp}`);
    return true;
  } else {
    console.log(`${RED}✗ ${manifest.name || path.basename(agentDir)} — INVALID manifest${RESET}`);
    validate.errors.forEach(err => {
      console.log(`  ${YELLOW}→ ${err.instancePath || '(root)'}: ${err.message}${RESET}`);
    });
    return false;
  }
}

function run() {
  const targetArg = process.argv[2];

  if (!targetArg) {
    console.log(`${BOLD}Usage:${RESET}`);
    console.log('  npx hyper-agent validate <agent-dir>');
    console.log('  npx hyper-agent validate .agents/');
    process.exit(1);
  }

  const target = path.resolve(targetArg);

  if (!fs.existsSync(target)) {
    console.log(`${RED}✗ Path not found: ${target}${RESET}`);
    process.exit(1);
  }

  const stat = fs.statSync(target);
  let passed = 0;
  let failed = 0;

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(target, { withFileTypes: true });
    const agentDirs = entries.filter(e => e.isDirectory()).map(e => path.join(target, e.name));

    // Check if target itself is an agent (has manifest.json)
    if (fs.existsSync(path.join(target, 'manifest.json'))) {
      // Single agent dir passed directly
      const ok = validateAgent(target);
      ok ? passed++ : failed++;
    } else {
      // Folder of agents
      if (agentDirs.length === 0) {
        console.log(`${YELLOW}⚠ No agent subdirectories found in ${target}${RESET}`);
        process.exit(0);
      }
      console.log(`${BOLD}Scanning ${agentDirs.length} agent(s) in ${path.basename(target)}/...${RESET}\n`);
      agentDirs.forEach(dir => {
        const ok = validateAgent(dir);
        ok ? passed++ : failed++;
      });
    }
  }

  console.log(`\n${BOLD}Results: ${GREEN}${passed} passed${RESET}${BOLD}, ${RED}${failed} failed${RESET}`);

  if (passed === 0 && failed > 0) {
    console.log(`${YELLOW}\nBuild at least 1 valid agent before running npm run graduate${RESET}`);
    process.exit(1);
  }

  process.exit(failed > 0 ? 1 : 0);
}

run();
