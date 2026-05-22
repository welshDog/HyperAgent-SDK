#!/usr/bin/env node
// hyper-agent registry — build, search, and browse the HyperAgent registry

const fs   = require('fs');
const path = require('path');

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const DIM    = '\x1b[2m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

// ─── Badge computation ────────────────────────────────────────────────────────

const BADGE_RULES = [
  { id: 'mcp-ready',       label: '⚡ MCP Ready',       test: m => m.mcp_compatible === true },
  { id: 'memory-enabled',  label: '🧠 Memory Enabled',  test: m => m.memory && m.memory !== 'none' },
  { id: 'multi-tool',      label: '🔧 Multi-Tool',      test: m => (m.tools?.length || 0) >= 3 },
  { id: 'env-declared',    label: '🔐 Env Declared',    test: m => (m.env_vars?.length || 0) > 0 },
  { id: 'hyper-coder',     label: '🚀 HyperCoder',      test: m => (m.course_level || 0) >= 4 },
  { id: 'elite',           label: '👑 Elite',           test: m => (m.course_level || 0) >= 5 },
  { id: 'health-checked',  label: '💚 Health Checked',  test: m => !!m.health_check },
  { id: 'web3-enabled',    label: '⛓️ Web3 Enabled',   test: m => !!m.web3 },
  { id: 'dnft',            label: '🛂 dNFT',            test: m => m.web3?.dnft === true },
];

/**
 * Compute the full badge list for a manifest.
 * Auto-applies rule-based badges and merges self-declared badges (deduped).
 *
 * @param {object} manifest - A valid HyperAgent manifest object.
 * @param {boolean} [verified=false] - Prepend the "verified" badge when true.
 * @returns {string[]} Array of badge IDs, e.g. `['verified', 'mcp-ready', 'multi-tool']`.
 */
function computeBadges(manifest, verified = false) {
  const badges = BADGE_RULES
    .filter(r => r.test(manifest))
    .map(r => r.id);
  if (verified) badges.unshift('verified');
  // Include any self-declared badges from the manifest (deduped)
  (manifest.badges || []).forEach(b => {
    if (!badges.includes(b)) badges.push(b);
  });
  return badges;
}

function renderBadge(id) {
  const rule = BADGE_RULES.find(r => r.id === id);
  if (rule) return `${CYAN}${rule.label}${RESET}`;
  if (id === 'verified') return `${GREEN}✅ Verified${RESET}`;
  return `${DIM}[${id}]${RESET}`;
}

// ─── Level label ─────────────────────────────────────────────────────────────

const LEVEL_LABELS = {
  1: 'HyperNewbie',
  2: 'Vibe Coder',
  3: 'Agent Builder',
  4: 'HyperCoder',
  5: 'BROski Elite',
};

// ─── Parse simple --key value / --key=value / --flag args ────────────────────

function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) {
        opts[a.slice(2, eq)] = a.slice(eq + 1);
      } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
        opts[a.slice(2)] = args[++i];
      } else {
        opts[a.slice(2)] = true;
      }
    }
  }
  return opts;
}

// ─── Registry file helpers ────────────────────────────────────────────────────

const DEFAULT_REGISTRY = 'registry.json';

function loadRegistry(filePath) {
  const resolved = path.resolve(filePath || DEFAULT_REGISTRY);
  if (!fs.existsSync(resolved)) {
    console.error(`${RED}✗ Registry not found: ${resolved}${RESET}`);
    console.error(`  Run ${CYAN}hyper-agent registry build <path>${RESET} first`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(resolved, 'utf8'));
  } catch {
    console.error(`${RED}✗ Invalid JSON in registry: ${resolved}${RESET}`);
    process.exit(1);
  }
}

// ─── Build ────────────────────────────────────────────────────────────────────

function buildRegistry(args) {
  const opts       = parseArgs(args);
  const pathArgs   = args.filter(a => !a.startsWith('--'));
  const targetArg  = pathArgs[0];
  const outFile    = opts.out || DEFAULT_REGISTRY;
  const useStrict  = opts.strict === true;

  if (!targetArg) {
    console.log(`${BOLD}Usage:${RESET} hyper-agent registry build <path> ${DIM}[--out registry.json] [--strict]${RESET}`);
    process.exit(1);
  }

  const target = path.resolve(targetArg);
  if (!fs.existsSync(target)) {
    console.error(`${RED}✗ Path not found: ${target}${RESET}`);
    process.exit(1);
  }

  const Ajv        = require('ajv');
  const addFormats = require('ajv-formats');
  const ajv        = new Ajv({ allErrors: true });
  addFormats(ajv);
  const spec       = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'hyper-agent-spec.json'), 'utf8'));
  const ajvValidate = ajv.compile(spec);

  const entries  = fs.readdirSync(target, { withFileTypes: true });
  const agentDirs = fs.existsSync(path.join(target, 'manifest.json'))
    ? [target]
    : entries.filter(e => e.isDirectory()).map(e => path.join(target, e.name));

  if (agentDirs.length === 0) {
    console.log(`${YELLOW}⚠ No agent directories found in ${target}${RESET}`);
    process.exit(0);
  }

  const seenPorts   = new Map();
  const agents      = [];
  let validCount    = 0;
  let invalidCount  = 0;
  const now         = new Date().toISOString();

  console.log(`${BOLD}Building registry from ${agentDirs.length} agent(s)...${RESET}\n`);

  agentDirs.forEach(dir => {
    const manifestPath = path.join(dir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.log(`  ${YELLOW}⚠ ${path.basename(dir)} — no manifest.json, skipping${RESET}`);
      return;
    }

    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      console.log(`  ${RED}✗ ${path.basename(dir)} — invalid JSON, skipping${RESET}`);
      invalidCount++;
      return;
    }

    if (!ajvValidate(manifest)) {
      console.log(`  ${RED}✗ ${manifest.name || path.basename(dir)} — schema invalid, skipping${RESET}`);
      invalidCount++;
      return;
    }

    // Strict checks for 'verified' badge
    let verified = false;
    if (useStrict) {
      const { strictChecks } = require('./validate');
      // We borrow strictChecks — need to expose it
      verified = _strictPassesForRegistry(dir, manifest, seenPorts);
    }

    const badges = computeBadges(manifest, verified);

    // Port conflict tracking
    if (manifest.mcp_compatible && manifest.port) {
      if (seenPorts.has(manifest.port)) {
        console.log(`  ${YELLOW}⚠ ${manifest.name} — port ${manifest.port} conflict with '${seenPorts.get(manifest.port)}'${RESET}`);
      } else {
        seenPorts.set(manifest.port, manifest.name);
      }
    }

    const relPath = path.relative(process.cwd(), manifestPath).replace(/\\/g, '/');

    agents.push({
      name:          manifest.name,
      version:       manifest.version,
      display_name:  manifest.display_name  || manifest.name,
      description:   manifest.description   || '',
      author:        manifest.author        || '',
      runtime:       manifest.runtime,
      tags:          manifest.tags          || [],
      badges,
      course_level:  manifest.course_level  || null,
      mcp_compatible: manifest.mcp_compatible,
      port:          manifest.port          || null,
      memory:        manifest.memory        || 'none',
      env_vars:      manifest.env_vars      || [],
      health_check:  manifest.health_check  || null,
      manifest_path: relPath,
      registered_at: now,
    });

    const badgeStr = badges.length ? ` ${DIM}[${badges.join(', ')}]${RESET}` : '';
    console.log(`  ${GREEN}✓ ${manifest.name} v${manifest.version}${RESET}${badgeStr}`);
    validCount++;
  });

  const registry = {
    spec_version:  '1.0.0',
    generated_at:  now,
    agent_count:   agents.length,
    agents,
  };

  const outPath = path.resolve(outFile);
  fs.writeFileSync(outPath, JSON.stringify(registry, null, 2));

  console.log(`\n${BOLD}Registry built: ${GREEN}${validCount} agents${RESET}${BOLD}${invalidCount > 0 ? `, ${RED}${invalidCount} skipped${RESET}` : ''}${RESET}`);
  console.log(`${DIM}→ ${outPath}${RESET}\n`);
}

// Inline strict check for registry build (no console output)
function _strictPassesForRegistry(agentDir, manifest, seenPorts) {
  const ep = path.join(agentDir, manifest.entrypoint);
  if (!fs.existsSync(ep)) return false;
  if (manifest.mcp_compatible && manifest.port && seenPorts.has(manifest.port)) return false;
  return true;
}

// ─── Search ───────────────────────────────────────────────────────────────────

function searchRegistry(args) {
  const opts = parseArgs(args);

  const registryFile = opts.registry || DEFAULT_REGISTRY;
  const registry     = loadRegistry(registryFile);

  let results = registry.agents;

  // Filter: --tags tag1,tag2 (OR — agent has at least one)
  if (opts.tags) {
    const wanted = opts.tags.split(',').map(t => t.trim().toLowerCase());
    results = results.filter(a =>
      a.tags.some(t => wanted.includes(t.toLowerCase()))
    );
  }

  // Filter: --runtime node
  if (opts.runtime) {
    results = results.filter(a => a.runtime === opts.runtime);
  }

  // Filter: --badge mcp-ready
  if (opts.badge) {
    const wantedBadge = opts.badge.toLowerCase();
    results = results.filter(a => a.badges.includes(wantedBadge));
  }

  // Filter: --level 3 (course_level >= N)
  if (opts.level) {
    const minLevel = parseInt(opts.level, 10);
    results = results.filter(a => (a.course_level || 0) >= minLevel);
  }

  // Filter: --memory redis
  if (opts.memory) {
    results = results.filter(a => a.memory === opts.memory);
  }

  if (results.length === 0) {
    console.log(`${YELLOW}⚠ No agents match the given filters${RESET}`);
    console.log(`${DIM}Registry: ${registryFile} (${registry.agent_count} total agents)${RESET}`);
    return;
  }

  console.log(`\n${BOLD}${results.length} agent(s) found${RESET} ${DIM}(${registry.agent_count} total in registry)${RESET}\n`);

  results.forEach(a => {
    const levelStr = a.course_level
      ? ` ${DIM}L${a.course_level} ${LEVEL_LABELS[a.course_level] || ''}${RESET}`
      : '';
    const portStr  = a.port ? ` ${DIM}:${a.port}${RESET}` : '';
    const memStr   = a.memory !== 'none' ? ` ${CYAN}[${a.memory}]${RESET}` : '';
    const tags     = a.tags.length ? `  ${DIM}tags: ${a.tags.join(', ')}${RESET}` : '';

    console.log(`${BOLD}${CYAN}${a.display_name}${RESET} ${DIM}(${a.name})${RESET} v${a.version}`);
    console.log(`  ${DIM}${a.description || 'No description'}${RESET}`);
    console.log(`  ${a.runtime}${portStr}${memStr}${levelStr}`);
    if (a.badges.length) {
      console.log(`  ${a.badges.map(renderBadge).join('  ')}`);
    }
    if (tags) console.log(tags);
    console.log();
  });
}

// ─── Show ─────────────────────────────────────────────────────────────────────

function showAgent(args) {
  const opts     = parseArgs(args);
  const nameArg  = args.filter(a => !a.startsWith('--'))[0];

  if (!nameArg) {
    console.log(`${BOLD}Usage:${RESET} hyper-agent registry show <name>`);
    process.exit(1);
  }

  const registryFile = opts.registry || DEFAULT_REGISTRY;
  const registry     = loadRegistry(registryFile);

  const agent = registry.agents.find(a => a.name === nameArg);
  if (!agent) {
    console.error(`${RED}✗ Agent '${nameArg}' not found in registry${RESET}`);
    console.log(`${DIM}Run ${CYAN}hyper-agent registry search${DIM} to list available agents${RESET}`);
    process.exit(1);
  }

  const level = agent.course_level
    ? `L${agent.course_level} — ${LEVEL_LABELS[agent.course_level] || 'Unknown'}`
    : 'Not set';

  console.log(`\n${BOLD}${CYAN}${agent.display_name}${RESET}`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`${BOLD}Name:${RESET}        ${agent.name}`);
  console.log(`${BOLD}Version:${RESET}     ${agent.version}`);
  console.log(`${BOLD}Author:${RESET}      ${agent.author || DIM + 'unknown' + RESET}`);
  console.log(`${BOLD}Runtime:${RESET}     ${agent.runtime}`);
  console.log(`${BOLD}Level:${RESET}       ${level}`);
  console.log(`${BOLD}Memory:${RESET}      ${agent.memory}`);
  console.log(`${BOLD}MCP:${RESET}         ${agent.mcp_compatible ? GREEN + 'yes' + RESET + (agent.port ? ` (port ${agent.port})` : '') : DIM + 'no' + RESET}`);
  if (agent.health_check) console.log(`${BOLD}Health:${RESET}      ${agent.health_check}`);
  if (agent.env_vars.length) console.log(`${BOLD}Env vars:${RESET}    ${agent.env_vars.join(', ')}`);
  if (agent.tags.length)     console.log(`${BOLD}Tags:${RESET}        ${agent.tags.join(', ')}`);
  console.log(`${BOLD}Manifest:${RESET}    ${DIM}${agent.manifest_path}${RESET}`);
  console.log(`${BOLD}Registered:${RESET}  ${DIM}${agent.registered_at}${RESET}`);

  if (agent.badges.length) {
    console.log(`\n${BOLD}Badges:${RESET}`);
    agent.badges.forEach(b => console.log(`  ${renderBadge(b)}`));
  }

  if (agent.description) {
    console.log(`\n${BOLD}Description:${RESET}`);
    console.log(`  ${agent.description}`);
  }

  console.log();
}

// ─── Sub-command router ───────────────────────────────────────────────────────

function run(args) {
  const [subcmd, ...rest] = args;

  const subcommands = {
    build:  () => buildRegistry(rest),
    search: () => searchRegistry(rest),
    show:   () => showAgent(rest),
  };

  if (!subcmd || !subcommands[subcmd]) {
    console.log(`${BOLD}Usage:${RESET}`);
    console.log(`  hyper-agent registry ${CYAN}build${RESET}  <path> ${DIM}[--out registry.json] [--strict]${RESET}`);
    console.log(`  hyper-agent registry ${CYAN}search${RESET} ${DIM}[--tags tag1,tag2] [--runtime node] [--badge mcp-ready] [--level 3] [--memory redis]${RESET}`);
    console.log(`  hyper-agent registry ${CYAN}show${RESET}   <name>\n`);
    if (subcmd) {
      console.error(`${RED}✗ Unknown registry subcommand: '${subcmd}'${RESET}`);
      process.exit(1);
    }
    process.exit(0);
  }

  subcommands[subcmd]();
}

if (require.main === module) {
  run(process.argv.slice(2));
}

module.exports = { run, computeBadges, BADGE_RULES };
