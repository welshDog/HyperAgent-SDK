#!/usr/bin/env node
// hyper-agent studio — starts the HyperAgent Studio visual GUI

const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const net      = require('net');
const { exec } = require('child_process');

const BOLD  = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const CYAN  = '\x1b[36m';
const RED   = '\x1b[31m';
const DIM   = '\x1b[2m';

const STUDIO_HTML = path.join(__dirname, '..', 'studio', 'index.html');

function parseArgs(argv) {
  const opts = { port: 4040, registry: 'registry.json', noOpen: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port'     && argv[i+1]) opts.port     = parseInt(argv[i+1], 10);
    if (argv[i] === '--registry' && argv[i+1]) opts.registry = argv[i+1];
    if (argv[i] === '--no-open')               opts.noOpen   = true;
  }
  return opts;
}

// Shared TCP health check — same logic as memory.js
function tcpPing(host, port, ms = 2000) {
  return new Promise(resolve => {
    const s = new net.Socket();
    s.setTimeout(ms);
    s.once('connect', () => { s.destroy(); resolve(true); })
     .once('error',   () => { s.destroy(); resolve(false); })
     .once('timeout', () => { s.destroy(); resolve(false); })
     .connect(port, host);
  });
}

async function memoryStatus(agents) {
  const cache = {};
  return Promise.all((agents || []).map(async a => {
    const mem = a.memory || 'none';
    if (mem === 'none') return { name: a.name, memory: mem, status: 'stateless' };
    const cfg = mem === 'redis' ? { host: 'localhost', port: 6379 }
                                : { host: 'localhost', port: 5432 };
    const key = `${mem}:${cfg.host}:${cfg.port}`;
    if (cache[key] === undefined) cache[key] = await tcpPing(cfg.host, cfg.port);
    return { name: a.name, memory: mem, status: cache[key] ? 'healthy' : 'offline', ...cfg };
  }));
}

function openBrowser(url) {
  const cmd = process.platform === 'win32'  ? `start "" "${url}"`
            : process.platform === 'darwin' ? `open "${url}"`
            : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type':                'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control':               'no-cache',
  });
  res.end(JSON.stringify(data, null, 2));
}

function run(argv) {
  const opts         = parseArgs(argv || []);
  const registryPath = path.resolve(opts.registry);

  const server = http.createServer(async (req, res) => {
    const url = req.url.split('?')[0];

    if (url === '/') {
      if (!fs.existsSync(STUDIO_HTML)) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Studio file not found at: ${STUDIO_HTML}\nRun: git pull`);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(STUDIO_HTML, 'utf8'));
      return;
    }

    if (url === '/api/registry') {
      if (!fs.existsSync(registryPath)) {
        json(res, {
          error: 'registry.json not found',
          hint:  'Run: hyper-agent registry build <path>',
        }, 404);
        return;
      }
      try {
        json(res, JSON.parse(fs.readFileSync(registryPath, 'utf8')));
      } catch {
        json(res, { error: 'Failed to parse registry.json' }, 500);
      }
      return;
    }

    if (url === '/api/memory') {
      try {
        const reg     = fs.existsSync(registryPath)
          ? JSON.parse(fs.readFileSync(registryPath, 'utf8'))
          : { agents: [] };
        const results = await memoryStatus(reg.agents);
        json(res, { checked_at: new Date().toISOString(), results });
      } catch (e) {
        json(res, { error: e.message }, 500);
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  server.listen(opts.port, '127.0.0.1', () => {
    const url = `http://localhost:${opts.port}`;
    console.log(`\n${BOLD}⚡ HyperAgent Studio${RESET}`);
    console.log(`${GREEN}✓${RESET} Running at ${CYAN}${url}${RESET}`);
    console.log(`${DIM}  Registry: ${registryPath}`);
    console.log(`  Ctrl+C to stop${RESET}\n`);
    if (!opts.noOpen) setTimeout(() => openBrowser(url), 500);
  });

  server.on('error', e => {
    if (e.code === 'EADDRINUSE') {
      console.error(`${RED}✗ Port ${opts.port} in use — try: --port ${opts.port + 1}${RESET}`);
    } else {
      console.error(`${RED}✗ ${e.message}${RESET}`);
    }
    process.exit(1);
  });
}

if (require.main === module) run(process.argv.slice(2));
module.exports = { run };
