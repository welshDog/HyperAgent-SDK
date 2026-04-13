#!/usr/bin/env node
// hyper-agent logs — streams recent logs from V2.4

const BOLD  = '\x1b[1m';
const CYAN  = '\x1b[36m';
const RED   = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

function levelColour(level) {
  if (!level) return RESET;
  const l = level.toUpperCase();
  if (l === 'ERROR' || l === 'CRITICAL') return RED;
  if (l === 'WARNING' || l === 'WARN')   return YELLOW;
  if (l === 'INFO')                       return CYAN;
  return DIM;
}

async function run(args) {
  const json    = args.includes('--json');
  const tailIdx = args.indexOf('--tail');
  const tail    = tailIdx !== -1 ? parseInt(args[tailIdx + 1], 10) || 50 : 50;
  const baseUrl = process.env.HYPERCODE_API_URL || 'http://localhost:8000';

  if (!json) console.log(`\n${BOLD}HyperCode V2.4 — Last ${tail} Logs${RESET}\n`);

  let data;
  try {
    const res = await fetch(`${baseUrl}/api/v1/logs?limit=${tail}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (e) {
    if (json) return console.log(JSON.stringify({ error: e.message }));
    console.error(`${RED}✗ Cannot reach ${baseUrl}/api/v1/logs${RESET}`);
    console.error(`${DIM}  Is hypercode-core running? Try: hyper-agent status${RESET}\n`);
    process.exit(1);
  }

  if (json) return console.log(JSON.stringify(data, null, 2));

  const logs = Array.isArray(data) ? data : data.logs || [];
  if (!logs.length) {
    console.log(`  ${DIM}No logs found.${RESET}\n`);
    return;
  }

  for (const entry of logs) {
    const ts    = entry.timestamp || entry.created_at || '';
    const level = entry.level || entry.levelname || 'INFO';
    const msg   = entry.message || entry.msg || JSON.stringify(entry);
    const col   = levelColour(level);
    console.log(`  ${DIM}${ts.slice(0, 19)}${RESET}  ${col}${level.padEnd(8)}${RESET}  ${msg}`);
  }
  console.log();
}

module.exports = { run };
