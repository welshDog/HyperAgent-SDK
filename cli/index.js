#!/usr/bin/env node
// hyper-agent CLI router — dispatches subcommands

const BOLD  = '\x1b[1m';
const CYAN  = '\x1b[36m';
const RESET = '\x1b[0m';
const DIM   = '\x1b[2m';

const COMMANDS = {
  validate: 'Validate manifest(s) against the HyperAgent spec',
  registry: 'Build, search, and browse the agent registry',
  memory:   'Check Redis/Postgres health & get docker run tips',
  studio:   'Launch HyperAgent Studio visual GUI in your browser',
  status:   'Check HyperCode V2.4 health — all services',
  logs:     'View recent logs from HyperCode V2.4',
  tokens:   'Award BROski$ tokens to a student by Discord ID',
  agents:   'List all agent heartbeats and online status',
  graduate: 'Manually trigger graduation for a student',
};

function usage() {
  console.log(`\n${BOLD}hyper-agent${RESET} — HyperAgent SDK CLI v${require('../package.json').version}\n`);
  console.log(`${BOLD}Usage:${RESET}`);
  console.log(`  hyper-agent ${CYAN}validate${RESET}  <path> ${DIM}[--strict]${RESET}`);
  console.log(`  hyper-agent ${CYAN}registry${RESET}  build  <path> ${DIM}[--out registry.json] [--strict]${RESET}`);
  console.log(`  hyper-agent ${CYAN}registry${RESET}  search ${DIM}[--tags tag1,tag2] [--runtime node]${RESET}`);
  console.log(`  hyper-agent ${CYAN}registry${RESET}  show   <name>`);
  console.log(`  hyper-agent ${CYAN}memory${RESET}    check  <path> ${DIM}[--all]${RESET}`);
  console.log(`  hyper-agent ${CYAN}studio${RESET}    ${DIM}[--port 4040] [--no-open]${RESET}`);
  console.log(`  hyper-agent ${CYAN}status${RESET}    ${DIM}[--json]${RESET}`);
  console.log(`  hyper-agent ${CYAN}logs${RESET}      ${DIM}[--tail 50] [--json]${RESET}`);
  console.log(`  hyper-agent ${CYAN}tokens${RESET}    award <discord_id> <amount> ${DIM}[--json]${RESET}`);
  console.log(`  hyper-agent ${CYAN}agents${RESET}    list ${DIM}[--json]${RESET}`);
  console.log(`  hyper-agent ${CYAN}graduate${RESET}  <discord_id> ${DIM}[--tokens 500] [--json]${RESET}\n`);
  console.log(`${BOLD}Commands:${RESET}`);
  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`  ${CYAN}${cmd.padEnd(12)}${RESET} ${desc}`);
  });
  console.log(`\n${DIM}Env vars: HYPERCODE_API_URL (default: http://localhost:8000)${RESET}`);
  console.log(`${DIM}          COURSE_SYNC_SECRET, SHOP_SYNC_SECRET${RESET}\n`);
}

const [,, cmd, ...args] = process.argv;

if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

// Phase 6 commands live in cli/commands/
const PHASE6 = ['status', 'logs', 'tokens', 'agents', 'graduate'];

if (PHASE6.includes(cmd)) {
  require(`./commands/${cmd}`).run(args);
} else if (COMMANDS[cmd]) {
  require(`./${cmd}`).run(args);
} else {
  console.error(`\x1b[31m✗ Unknown command: '${cmd}'\x1b[0m`);
  usage();
  process.exit(1);
}
