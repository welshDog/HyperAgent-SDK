#!/usr/bin/env node
// hyper-agent graduate — build bundle or trigger graduation

const BOLD  = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const CYAN  = '\x1b[36m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

function usage() {
  console.log(`\n${BOLD}Usage:${RESET}`);
  console.log(`  hyper-agent graduate ${CYAN}build${RESET} <cluster.json> --out <dir> ${DIM}[--strict] [--json]${RESET}`);
  console.log(`  hyper-agent graduate ${CYAN}trigger${RESET} <discord_id> ${DIM}[--tokens 500] [--json]${RESET}`);
  console.log(`  hyper-agent graduate ${CYAN}<discord_id>${RESET} ${DIM}[--tokens 500] [--json]${RESET}`);
  console.log(`\n${BOLD}Example:${RESET}`);
  console.log(`  hyper-agent graduate build cluster.json --out out/\n`);
  console.log(`  hyper-agent graduate trigger 123456789\n`);
}

function pickArgValue(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  const v = args[idx + 1];
  if (!v || v.startsWith('--')) return null;
  return v;
}

function isFlag(args, name) {
  return args.includes(name);
}

async function run(args) {
  const json = isFlag(args, '--json');
  const strict = isFlag(args, '--strict');

  const head = args[0];
  const mode = head === 'build' || head === 'trigger' ? head : 'trigger';
  const rest = mode === 'trigger' && head !== 'trigger' && head !== 'build' ? args : args.slice(1);

  if (mode === 'build') {
    const clusterPath = rest.filter(a => !a.startsWith('--'))[0];
    const outDir = pickArgValue(rest, '--out');
    if (!clusterPath || !outDir) {
      usage();
      process.exit(1);
    }

    const { buildGraduateBundle } = require('../lib/graduateBuild');
    try {
      const result = await buildGraduateBundle({ clusterPath, outDir, strict });
      if (json) return console.log(JSON.stringify(result, null, 2));
      console.log(`\n${GREEN}✅ Bundle created${RESET}`);
      console.log(`  ${CYAN}${result.outDir}${RESET}`);
      console.log(`  agents: ${result.agents.length}`);
      return;
    } catch (e) {
      if (json) return console.log(JSON.stringify({ error: e.message }));
      console.error(`${RED}✗ Build failed: ${e.message}${RESET}\n`);
      process.exit(1);
    }
  }

  const discordId = rest.filter(a => !a.startsWith('--'))[0];
  const tokensRaw = pickArgValue(rest, '--tokens');
  const tokens = tokensRaw ? parseInt(tokensRaw, 10) : 500;
  const baseUrl = process.env.HYPERCODE_API_URL || 'http://localhost:8000';
  const secret = process.env.COURSE_SYNC_SECRET || process.env.SHOP_SYNC_SECRET || '';

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
