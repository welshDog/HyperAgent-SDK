#!/usr/bin/env node
// hyper-agent graduate <discord_id> — manually triggers graduation for a student

const BOLD  = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const CYAN  = '\x1b[36m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

function usage() {
  console.log(`\n${BOLD}Usage:${RESET}`);
  console.log(`  hyper-agent graduate ${CYAN}<discord_id>${RESET} ${DIM}[--tokens 500] [--json]${RESET}`);
  console.log(`\n${BOLD}Example:${RESET}`);
  console.log(`  hyper-agent graduate 123456789\n`);
}

async function run(args) {
  const json       = args.includes('--json');
  const discordId  = args.filter(a => !a.startsWith('--'))[0];
  const tokensIdx  = args.indexOf('--tokens');
  const tokens     = tokensIdx !== -1 ? parseInt(args[tokensIdx + 1], 10) : 500;
  const baseUrl    = process.env.HYPERCODE_API_URL || 'http://localhost:8000';
  const secret     = process.env.SHOP_SYNC_SECRET || '';

  if (!discordId) {
    usage();
    process.exit(1);
  }

  if (!json) console.log(`\n${BOLD}🎓 Graduating ${CYAN}${discordId}${RESET}${BOLD} with ${CYAN}${tokens} BROski$${RESET}\n`);

  const source_id = `cli_graduate_${discordId}_${Date.now()}`;

  let data;
  try {
    const res = await fetch(`${baseUrl}/api/v1/graduate/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Secret': secret,
      },
      body: JSON.stringify({
        discord_id: discordId,
        source_id,
        badge_slug: 'hyper-graduate',
        tokens_awarded: tokens,
      }),
    });
    data = await res.json();
    if (res.status === 409) {
      if (json) return console.log(JSON.stringify({ status: 'already_graduated', ...data }));
      console.log(`  🎓 ${CYAN}${discordId}${RESET} already graduated — nothing to do!\n`);
      return;
    }
    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
  } catch (e) {
    if (json) return console.log(JSON.stringify({ error: e.message }));
    console.error(`${RED}✗ Graduation failed: ${e.message}${RESET}\n`);
    process.exit(1);
  }

  if (json) return console.log(JSON.stringify(data, null, 2));
  console.log(`  ${GREEN}✅ GRADUATED!${RESET}  ${CYAN}${discordId}${RESET}`);
  console.log(`  🏅 Badge: ${data.badge_slug || 'hyper-graduate'}`);
  console.log(`  💰 Tokens: +${data.tokens_awarded || tokens} BROski$`);
  if (data.portfolio_url) console.log(`  🌐 Portfolio: ${data.portfolio_url}`);
  console.log(`  📨 Discord DM: ${data.discord_role_assigned ? 'sent ✅' : 'failed ❌'}`);
  console.log(`  ${DIM}source_id: ${source_id}${RESET}\n`);
}

module.exports = { run };
