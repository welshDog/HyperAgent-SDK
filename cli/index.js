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
};

function usage() {
  console.log(`\n${BOLD}hyper-agent${RESET} — HyperAgent SDK CLI v${require('../package.json').version}\n`);
  console.log(`${BOLD}Usage:${RESET}`);
  console.log(`  hyper-agent ${CYAN}validate${RESET} <path> ${DIM}[--strict]${RESET}`);
  console.log(`  hyper-agent ${CYAN}registry${RESET} build  <path> ${DIM}[--out registry.json] [--strict]${RESET}`);
  console.log(`  hyper-agent ${CYAN}registry${RESET} search ${DIM}[--tags tag1,tag2] [--runtime node] [--badge mcp-ready] [--level 3]${RESET}`);
  console.log(`  hyper-agent ${CYAN}registry${RESET} show   <name>`);
  console.log(`  hyper-agent ${CYAN}memory${RESET}   check  <path> ${DIM}[--all] [--redis-host HOST] [--redis-port PORT] [--pg-host HOST] [--pg-port PORT]${RESET}`);
  console.log(`  hyper-agent ${CYAN}studio${RESET}          ${DIM}[--port 4040] [--registry registry.json] [--no-open]${RESET}\n`);
  console.log(`${BOLD}Commands:${RESET}`);
  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`  ${CYAN}${cmd.padEnd(10)}${RESET} ${desc}`);
  });
  console.log();
}

const [,, cmd, ...args] = process.argv;

if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

if (!COMMANDS[cmd]) {
  console.error(`\x1b[31m✗ Unknown command: '${cmd}'\x1b[0m`);
  usage();
  process.exit(1);
}

require(`./${cmd}`).run(args);
