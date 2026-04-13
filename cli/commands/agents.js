#!/usr/bin/env node
// hyper-agent agents list — shows all agent heartbeats from V2.4

const BOLD  = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const CYAN  = '\x1b[36m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

async function run(args) {
  const json    = args.includes('--json');
  const subCmd  = args[0] || 'list';
  const baseUrl = process.env.HYPERCODE_API_URL || 'http://localhost:8000';

  if (!json) console.log(`\n${BOLD}HyperCode V2.4 — Agent Status${RESET}\n`);

  let data;
  try {
    const res = await fetch(`${baseUrl}/api/v1/agents/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (e) {
    if (json) return console.log(JSON.stringify({ error: e.message }));
    console.error(`${RED}✗ Cannot reach ${baseUrl}/api/v1/agents/status${RESET}`);
    console.error(`${DIM}  Try: hyper-agent status${RESET}\n`);
    process.exit(1);
  }

  if (json) return console.log(JSON.stringify(data, null, 2));

  const agents = Array.isArray(data) ? data : data.agents || [];
  if (!agents.length) {
    console.log(`  ${DIM}No agents found. Are they running?${RESET}\n`);
    return;
  }

  console.log(`  ${'NAME'.padEnd(24)} ${'STATUS'.padEnd(10)} LAST SEEN`);
  console.log(`  ${'-'.repeat(55)}`);
  for (const agent of agents) {
    const online = agent.status === 'online';
    const icon   = online ? `${GREEN}●${RESET}` : `${RED}●${RESET}`;
    const name   = (agent.name || agent.id || 'unknown').padEnd(22);
    const status = (agent.status || 'unknown').padEnd(10);
    const seen   = agent.last_seen || agent.lastSeen || 'unknown';
    console.log(`  ${icon} ${CYAN}${name}${RESET} ${status} ${DIM}${seen}${RESET}`);
  }
  console.log();
}

module.exports = { run };
