#!/usr/bin/env node
// hyper-agent tokens award <discord_id> <amount> — awards BROski$ via V2.4 economy endpoint

const BOLD  = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const CYAN  = '\x1b[36m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

function usage() {
  console.log(`\n${BOLD}Usage:${RESET}`);
  console.log(`  hyper-agent tokens award ${CYAN}<discord_id> <amount>${RESET} ${DIM}[--json]${RESET}`);
  console.log(`\n${BOLD}Example:${RESET}`);
  console.log(`  hyper-agent tokens award 123456789 500\n`);
}

async function run(args) {
  const json      = args.includes('--json');
  const subCmd    = args[0];
  const discordId = args[1];
  const amount    = parseInt(args[2], 10);
  const baseUrl   = process.env.HYPERCODE_API_URL || 'http://localhost:8000';
  const secret    = process.env.COURSE_SYNC_SECRET || '';

  if (subCmd !== 'award' || !discordId || isNaN(amount)) {
    usage();
    process.exit(1);
  }

  if (!json) console.log(`\n${BOLD}Awarding ${CYAN}${amount} BROski$${RESET}${BOLD} to ${CYAN}${discordId}${RESET}\n`);

  // Use a unique source_id so it's idempotent
  const source_id = `cli_award_${discordId}_${Date.now()}`;

  let data;
  try {
    const res = await fetch(`${baseUrl}/api/v1/economy/award-from-course`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Secret': secret,
      },
      body: JSON.stringify({ discord_id: discordId, tokens: amount, source_id }),
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
  } catch (e) {
    if (json) return console.log(JSON.stringify({ error: e.message }));
    console.error(`${RED}✗ Award failed: ${e.message}${RESET}\n`);
    process.exit(1);
  }

  if (json) return console.log(JSON.stringify(data, null, 2));
  console.log(`  ${GREEN}✅ Done!${RESET}  ${amount} BROski$ awarded to ${CYAN}${discordId}${RESET}`);
  console.log(`  ${DIM}source_id: ${source_id}${RESET}\n`);
}

module.exports = { run };
