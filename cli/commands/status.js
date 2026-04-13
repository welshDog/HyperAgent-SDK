#!/usr/bin/env node
// hyper-agent status — hits V2.4 /health and pretty-prints all service statuses

const BOLD  = '\x1b[1m';
const CYAN  = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

async function run(args) {
  const json = args.includes('--json');
  const baseUrl = process.env.HYPERCODE_API_URL || 'http://localhost:8000';

  if (!json) console.log(`\n${BOLD}HyperCode V2.4 — Status${RESET} ${DIM}(${baseUrl})${RESET}\n`);

  let data;
  try {
    const res = await fetch(`${baseUrl}/health`);
    data = await res.json();
  } catch (e) {
    if (json) return console.log(JSON.stringify({ error: e.message }));
    console.error(`${RED}✗ Cannot reach ${baseUrl}/health${RESET}`);
    console.error(`${DIM}  Is Docker running? Try: docker compose up -d hypercode-core${RESET}\n`);
    process.exit(1);
  }

  if (json) return console.log(JSON.stringify(data, null, 2));

  const overall = data.status === 'healthy' || data.status === 'ok';
  const icon = overall ? `${GREEN}✅${RESET}` : `${RED}🚨${RESET}`;
  console.log(`  Overall   ${icon}  ${BOLD}${data.status?.toUpperCase()}${RESET}`);
  console.log(`  Version   ${CYAN}${data.version || 'unknown'}${RESET}`);
  console.log(`  Env       ${DIM}${data.environment || 'unknown'}${RESET}`);

  if (data.checks) {
    console.log(`\n${BOLD}  Services:${RESET}`);
    for (const [svc, result] of Object.entries(data.checks)) {
      const ok = result?.status === 'ok';
      const svcIcon = ok ? `${GREEN}✅${RESET}` : `${RED}❌${RESET}`;
      const detail = result?.detail ? `  ${DIM}${result.detail}${RESET}` : '';
      console.log(`    ${svcIcon}  ${svc.padEnd(12)} ${result?.status || 'unknown'}${detail}`);
    }
  }
  console.log();
}

module.exports = { run };
