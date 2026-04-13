#!/usr/bin/env node
// hyper-agent memory check — Smart Memory Provisioning
// Reads manifest.json, pings Redis/Postgres, shows health, suggests docker run

const fs   = require('fs');
const path = require('path');
const net  = require('net');

// ── Colours ──────────────────────────────────────────────────────────────────
const BOLD    = '\x1b[1m';
const RESET   = '\x1b[0m';
const GREEN   = '\x1b[32m';
const RED     = '\x1b[31m';
const YELLOW  = '\x1b[33m';
const CYAN    = '\x1b[36m';
const DIM     = '\x1b[2m';
const MAGENTA = '\x1b[35m';

// ── Helpers ───────────────────────────────────────────────────────────────────
function ok(msg)   { console.log(`  ${GREEN}✅ ${msg}${RESET}`); }
function warn(msg) { console.log(`  ${YELLOW}⚠️  ${msg}${RESET}`); }
function err(msg)  { console.log(`  ${RED}✗  ${msg}${RESET}`); }
function info(msg) { console.log(`  ${CYAN}ℹ️  ${msg}${RESET}`); }
function tip(msg)  { console.log(`  ${MAGENTA}💡 ${msg}${RESET}`); }
function dim(msg)  { console.log(`  ${DIM}${msg}${RESET}`); }

/**
 * TCP ping — resolves true if port is open, false if refused/timeout
 */
function tcpPing(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(timeoutMs);
    sock
      .once('connect', () => { sock.destroy(); resolve(true); })
      .once('error',   () => { sock.destroy(); resolve(false); })
      .once('timeout', () => { sock.destroy(); resolve(false); })
      .connect(port, host);
  });
}

/**
 * Parse --host / --port / --pg-host / --pg-port overrides from argv
 */
function parseArgs(argv) {
  const opts = {
    agentPath:  argv.find(a => !a.startsWith('-')) || '.',
    redisHost:  'localhost',
    redisPort:  6379,
    pgHost:     'localhost',
    pgPort:     5432,
    pgName:     null,   // optional: show in tip
    all:        argv.includes('--all'),
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--redis-host') opts.redisHost = argv[i + 1];
    if (argv[i] === '--redis-port') opts.redisPort = parseInt(argv[i + 1], 10);
    if (argv[i] === '--pg-host')    opts.pgHost    = argv[i + 1];
    if (argv[i] === '--pg-port')    opts.pgPort    = parseInt(argv[i + 1], 10);
    if (argv[i] === '--pg-name')    opts.pgName    = argv[i + 1];
  }
  return opts;
}

/**
 * Load manifest.json from agent directory
 */
function loadManifest(agentPath) {
  const manifestFile = path.resolve(agentPath, 'manifest.json');
  if (!fs.existsSync(manifestFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Scan all manifests in a directory (for --all mode)
 */
function scanAllManifests(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      const m = loadManifest(path.join(dir, e.name));
      if (m) results.push({ name: e.name, manifest: m });
    }
  }
  return results;
}

// ── Redis Health ──────────────────────────────────────────────────────────────
async function checkRedis(host, port) {
  console.log(`\n${BOLD}🔴 Redis${RESET} ${DIM}${host}:${port}${RESET}`);
  const alive = await tcpPing(host, port);
  if (alive) {
    ok(`Redis is ONLINE at ${host}:${port}`);
    ok('Memory backend ready — agents can persist state 🧠');
    return true;
  } else {
    err(`Redis is OFFLINE at ${host}:${port}`);
    warn('Agents using memory: redis will fail at runtime');
    console.log();
    tip('Start Redis with Docker:');
    dim(`  docker run -d --name hyper-redis -p ${port}:6379 redis:alpine`);
    tip('Or start existing container:');
    dim('  docker start hyper-redis');
    tip('Verify it\'s running:');
    dim('  docker ps | grep redis');
    return false;
  }
}

// ── Postgres Health ───────────────────────────────────────────────────────────
async function checkPostgres(host, port, dbName) {
  const label = dbName ? `${host}:${port}/${dbName}` : `${host}:${port}`;
  console.log(`\n${BOLD}🐘 Postgres${RESET} ${DIM}${label}${RESET}`);
  const alive = await tcpPing(host, port);
  if (alive) {
    ok(`Postgres is ONLINE at ${label}`);
    ok('Memory backend ready — agents can persist long-term data 💾');
    return true;
  } else {
    err(`Postgres is OFFLINE at ${label}`);
    warn('Agents using memory: postgres will fail at runtime');
    const db = dbName || 'hyperagents';
    console.log();
    tip('Start Postgres with Docker:');
    dim(`  docker run -d --name hyper-postgres \\`);
    dim(`    -e POSTGRES_USER=hyper \\`);
    dim(`    -e POSTGRES_PASSWORD=hyperpass \\`);
    dim(`    -e POSTGRES_DB=${db} \\`);
    dim(`    -p ${port}:5432 postgres:16-alpine`);
    tip('Or start existing container:');
    dim('  docker start hyper-postgres');
    tip('Connect and verify:');
    dim(`  docker exec -it hyper-postgres psql -U hyper -d ${db}`);
    return false;
  }
}

// ── Single Agent Check ────────────────────────────────────────────────────────
async function checkAgent(manifest, opts, label) {
  const memory = manifest.memory || 'none';
  const name   = label || manifest.name;

  console.log(`\n${BOLD}${CYAN}━━━ Agent: ${name} ${RESET}${DIM}(memory: ${memory})${RESET}`);

  if (memory === 'none') {
    info(`No memory backend declared — running stateless`);
    dim('  To add memory, set "memory": "redis" or "memory": "postgres" in manifest.json');
    return { name, memory, status: 'stateless' };
  }

  if (memory === 'redis') {
    const alive = await checkRedis(opts.redisHost, opts.redisPort);
    return { name, memory, status: alive ? 'healthy' : 'offline' };
  }

  if (memory === 'postgres') {
    const alive = await checkPostgres(opts.pgHost, opts.pgPort, opts.pgName);
    return { name, memory, status: alive ? 'healthy' : 'offline' };
  }

  return { name, memory, status: 'unknown' };
}

// ── Summary Table ─────────────────────────────────────────────────────────────
function printSummary(results) {
  if (results.length <= 1) return;
  console.log(`\n${BOLD}📊 Memory Health Summary${RESET}`);
  console.log('  ' + '─'.repeat(52));
  console.log(`  ${BOLD}${'Agent'.padEnd(28)} ${'Memory'.padEnd(10)} Status${RESET}`);
  console.log('  ' + '─'.repeat(52));
  for (const r of results) {
    const icon =
      r.status === 'healthy'   ? `${GREEN}✅ healthy${RESET}`   :
      r.status === 'offline'   ? `${RED}✗  offline${RESET}`   :
      r.status === 'stateless' ? `${DIM}── stateless${RESET}` :
      `${YELLOW}?  unknown${RESET}`;
    console.log(`  ${r.name.padEnd(28)} ${r.memory.padEnd(10)} ${icon}`);
  }
  console.log('  ' + '─'.repeat(52));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run(argv) {
  const opts = parseArgs(argv);

  console.log(`\n${BOLD}🧠 HyperAgent Memory Check${RESET} ${DIM}v2${RESET}`);
  console.log(DIM + '  Scanning memory backends for your agents...' + RESET);

  const results = [];

  if (opts.all) {
    // Scan all agents in a templates/ or .agents/ dir
    const entries = scanAllManifests(opts.agentPath);
    if (entries.length === 0) {
      warn(`No agent manifests found in: ${opts.agentPath}`);
      process.exit(0);
    }
    for (const { name, manifest } of entries) {
      const r = await checkAgent(manifest, opts, name);
      results.push(r);
    }
  } else {
    // Single agent check
    const manifest = loadManifest(opts.agentPath);
    if (!manifest) {
      err(`No manifest.json found in: ${path.resolve(opts.agentPath)}`);
      tip('Usage: hyper-agent memory check <agent-dir> [--all] [--redis-host HOST] [--pg-host HOST]');
      process.exit(1);
    }
    const r = await checkAgent(manifest, opts);
    results.push(r);
  }

  printSummary(results);

  // Exit code: 1 if any backend is offline
  const anyOffline = results.some(r => r.status === 'offline');
  console.log();
  if (anyOffline) {
    warn('One or more memory backends are offline. Fix before deploying.');
    process.exit(1);
  } else {
    ok('All memory backends healthy! Ready to deploy. 🚀');
    process.exit(0);
  }
}

module.exports = { run };
