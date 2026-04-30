// hyper-agent init — scaffold a new agent from a built-in template
//
// Usage:
//   hyper-agent init [target-dir] --template <name>
//   hyper-agent init my-bot --template python
//   hyper-agent init --template mcp           # → ./my-mcp-agent
//
// Templates: python | node | typescript | mcp

const fs   = require('fs');
const path = require('path');

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

const TEMPLATES = {
  python:     'python-starter',
  node:       'node-starter',
  typescript: 'typescript-starter',
  ts:         'typescript-starter',
  mcp:        'mcp-starter',
};

const TEMPLATES_ROOT = path.join(__dirname, '..', '..', 'templates');

function usage() {
  console.log(`\n${BOLD}hyper-agent init${RESET} — scaffold a new agent from a template\n`);
  console.log(`${BOLD}Usage:${RESET}`);
  console.log(`  hyper-agent init ${DIM}[target-dir]${RESET} --template ${CYAN}<name>${RESET}\n`);
  console.log(`${BOLD}Templates:${RESET}`);
  console.log(`  ${CYAN}python${RESET}      Python starter (main.py + requirements.txt)`);
  console.log(`  ${CYAN}node${RESET}        Node.js starter (index.js + package.json)`);
  console.log(`  ${CYAN}typescript${RESET}  TypeScript starter (src/index.ts + tsconfig)`);
  console.log(`  ${CYAN}mcp${RESET}         MCP-compatible agent (port 3200, MCP SDK)`);
  console.log(`\n${BOLD}Examples:${RESET}`);
  console.log(`  ${DIM}hyper-agent init my-bot --template python${RESET}`);
  console.log(`  ${DIM}hyper-agent init --template mcp${RESET}             ${DIM}# → ./my-mcp-agent${RESET}\n`);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function isKebabCase(name) {
  return /^[a-z][a-z0-9-]{1,48}[a-z0-9]$/.test(name);
}

function rewriteManifestName(dir, agentName) {
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.name = agentName;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

function rewritePackageName(dir, agentName) {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) return;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.name = agentName;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function run(args) {
  const tplFlagIdx = args.indexOf('--template');
  if (tplFlagIdx === -1 || !args[tplFlagIdx + 1]) {
    console.log(`${RED}✗ Missing --template flag${RESET}`);
    usage();
    process.exit(1);
  }

  const tplKey = args[tplFlagIdx + 1].toLowerCase();
  const tplDir = TEMPLATES[tplKey];
  if (!tplDir) {
    console.log(`${RED}✗ Unknown template: '${tplKey}'${RESET}`);
    console.log(`${DIM}  Available: ${Object.keys(TEMPLATES).join(', ')}${RESET}\n`);
    process.exit(1);
  }

  const positional = args.filter((a, i) => !a.startsWith('--') && i !== tplFlagIdx + 1);
  const targetArg  = positional[0] || `my-${tplKey === 'ts' ? 'typescript' : tplKey}-agent`;
  const targetDir  = path.resolve(targetArg);
  const agentName  = path.basename(targetDir);

  if (!isKebabCase(agentName)) {
    console.log(`${RED}✗ Agent name must be kebab-case (3-50 chars): got '${agentName}'${RESET}`);
    console.log(`${DIM}  Try: my-cool-agent, broski-bot, hello-world${RESET}\n`);
    process.exit(1);
  }

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    console.log(`${RED}✗ Target directory is not empty: ${targetDir}${RESET}\n`);
    process.exit(1);
  }

  const src = path.join(TEMPLATES_ROOT, tplDir);
  if (!fs.existsSync(src)) {
    console.log(`${RED}✗ Template directory missing on disk: ${src}${RESET}`);
    console.log(`${DIM}  This is an SDK installation issue — please report it.${RESET}\n`);
    process.exit(1);
  }

  console.log(`${CYAN}◆ Scaffolding ${tplKey} agent → ${targetDir}${RESET}`);
  copyDir(src, targetDir);
  rewriteManifestName(targetDir, agentName);
  rewritePackageName(targetDir, agentName);

  console.log(`${GREEN}✓ Created ${agentName}/${RESET}`);
  console.log(`\n${BOLD}Next steps:${RESET}`);
  console.log(`  ${DIM}cd ${path.relative(process.cwd(), targetDir) || '.'}${RESET}`);
  if (tplKey === 'python') {
    console.log(`  ${DIM}pip install -r requirements.txt${RESET}`);
    console.log(`  ${DIM}python main.py${RESET}`);
  } else if (tplKey === 'typescript' || tplKey === 'ts') {
    console.log(`  ${DIM}npm install${RESET}`);
    console.log(`  ${DIM}npm run dev${RESET}`);
  } else {
    console.log(`  ${DIM}npm install${RESET}`);
    console.log(`  ${DIM}npm start${RESET}`);
  }
  console.log(`  ${DIM}hyper-agent validate .${RESET}\n`);
}

module.exports = { run };
