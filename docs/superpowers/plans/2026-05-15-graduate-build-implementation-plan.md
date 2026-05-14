# HyperAgent-SDK Graduate Build + Trigger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `hyper-agent graduate build` to generate a single shared `docker-compose.agents.yml` bundle from `cluster.json`, and upgrade `hyper-agent graduate` into `graduate trigger` with consistent secret handling.

**Architecture:** Extend `cli/commands/graduate.js` into a small command router (`build` vs `trigger`) and add a new internal builder module that (1) loads `cluster.json`, (2) validates manifests using the existing strict validator, (3) copies agent folders, (4) generates per-agent Dockerfiles, (5) emits one compose YAML + README.

**Tech Stack:** Node.js (>=18), existing CLI code, `node --test`

---

## File Map (new/changed)

**Create**
- `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/cli/lib/graduateBuild.js`
- `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/cli/lib/yaml.js`
- `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/tests/graduate-build.test.js`

**Modify**
- `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/cli/commands/graduate.js`
- `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/cli/index.js`
- `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/README.md` (only if references conflict with new commands)

---

### Task 1: Add a minimal YAML emitter (no dependency)

**Files:**
- Create: `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/cli/lib/yaml.js`
- Test: `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/tests/graduate-build.test.js`

- [ ] **Step 1: Write a failing test for YAML output stability**

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const { dumpYaml } = require('../cli/lib/yaml')

test('dumpYaml produces readable compose-like YAML', () => {
  const yml = dumpYaml({
    services: {
      'agent-test': {
        build: { context: './agents/test', dockerfile: './Dockerfile.test' },
        environment: ['AGENT_ID=test'],
        networks: ['agents-net'],
      },
    },
    networks: { 'agents-net': {} },
  })
  assert.match(yml, /services:\n/)
  assert.match(yml, /agent-test:\n/)
  assert.match(yml, /networks:\n/)
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:
```bash
cd h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK
npm test
```
Expected: FAIL because `../cli/lib/yaml` does not exist.

- [ ] **Step 3: Implement `dumpYaml`**

```js
function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

function dumpNode(node, indent) {
  const pad = '  '.repeat(indent)

  if (Array.isArray(node)) {
    if (node.length === 0) return '[]\n'
    return node.map((v) => `${pad}- ${String(v)}\n`).join('')
  }

  if (isPlainObject(node)) {
    const keys = Object.keys(node)
    if (keys.length === 0) return '{}\n'
    return keys.map((k) => {
      const v = node[k]
      if (isPlainObject(v) || Array.isArray(v)) return `${pad}${k}:\n${dumpNode(v, indent + 1)}`
      return `${pad}${k}: ${String(v)}\n`
    }).join('')
  }

  return `${pad}${String(node)}\n`
}

function dumpYaml(obj) {
  return dumpNode(obj, 0)
}

module.exports = { dumpYaml }
```

- [ ] **Step 4: Run tests**

Run:
```bash
npm test
```
Expected: PASS for the new YAML test (other tests must remain green).

- [ ] **Step 5: Commit**

```bash
git add cli/lib/yaml.js tests/graduate-build.test.js
git commit -m "feat(sdk): add tiny yaml emitter for bundle generation"
```

---

### Task 2: Implement `graduate build` core builder

**Files:**
- Create: `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/cli/lib/graduateBuild.js`
- Test: `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/tests/graduate-build.test.js`

- [ ] **Step 1: Add failing tests for cluster validation + memory default**

```js
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { buildGraduateBundle } = require('../cli/lib/graduateBuild')

async function makeTempDir() {
  return await fsp.mkdtemp(path.join(os.tmpdir(), 'hyperagent-sdk-'))
}

async function writeJson(p, obj) {
  await fsp.mkdir(path.dirname(p), { recursive: true })
  await fsp.writeFile(p, JSON.stringify(obj, null, 2), 'utf8')
}

test('buildGraduateBundle defaults memory to none when omitted', async () => {
  const root = await makeTempDir()
  const agentDir = path.join(root, 'a1')
  await fsp.mkdir(agentDir, { recursive: true })

  await writeJson(path.join(agentDir, 'manifest.json'), {
    name: 'a1',
    version: '0.1.0',
    runtime: 'node',
    entrypoint: 'index.js',
    tools: [{ name: 'do_thing', description: 'x', input_schema: {} }],
    mcp_compatible: false,
  })
  await fsp.writeFile(path.join(agentDir, 'index.js'), 'console.log("ok")', 'utf8')
  await fsp.writeFile(path.join(agentDir, 'package.json'), JSON.stringify({ name: 'a1', version: '0.1.0' }), 'utf8')

  const clusterPath = path.join(root, 'cluster.json')
  await writeJson(clusterPath, {
    cluster: 'c',
    agents: [{ name: 'a1', manifest_path: path.join(agentDir, 'manifest.json') }],
  })

  const outDir = path.join(root, 'out')
  const result = await buildGraduateBundle({ clusterPath, outDir, strict: true })
  assert.equal(result.agents[0].memory, 'none')
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:
```bash
npm test
```
Expected: FAIL because `../cli/lib/graduateBuild` does not exist.

- [ ] **Step 3: Implement `buildGraduateBundle`**

Implementation requirements:
- Parse `cluster.json` (fail if invalid)
- Ensure `agents` is a non-empty array
- For each agent:
  - Resolve absolute `manifest_path`
  - Derive `agentDir = dirname(manifest_path)`
  - Validate using existing strict validator:
    - `const { validateAgent } = require('../validate')`
    - Use a shared `seenPorts` Map across agents
  - Fail if manifest `name !== agent.name` (explicit mismatch safety)
  - Apply `memory = agent.memory ?? 'none'`
  - Track cluster port collisions for MCP ports (use a Set on `manifest.port` when `mcp_compatible`)
- Create `outDir`, copy `agentDir` into `outDir/agents/<agent-name>/` (recursive)
- Generate per-agent Dockerfile string and write `outDir/Dockerfile.<agent-name>`
- Build compose object, then write YAML using `dumpYaml`
- Generate `README.md` with:
  - Standalone run snippet
  - Join V2.4 network snippet + `docker network ls | findstr agents-net`
- Return a JSON result `{ outDir, cluster, agents: [...], files: [...] }`

Suggested skeleton:
```js
const fsp = require('node:fs/promises')
const fs = require('node:fs')
const path = require('node:path')
const { validateAgent } = require('../validate')
const { dumpYaml } = require('./yaml')

function dockerfileFor(runtime, entrypoint, agentDir) {
  if (runtime === 'python') {
    const hasReq = fs.existsSync(path.join(agentDir, 'requirements.txt'))
    return [
      'FROM python:3.11-slim',
      'WORKDIR /app',
      'COPY . .',
      hasReq ? 'RUN pip install --no-cache-dir -r requirements.txt' : '',
      `CMD ["python","${entrypoint.replace(/\\/g,'/')}"]`,
      '',
    ].filter(Boolean).join('\n')
  }
  if (runtime === 'node') {
    const hasLock = fs.existsSync(path.join(agentDir, 'package-lock.json'))
    const hasPkg = fs.existsSync(path.join(agentDir, 'package.json'))
    return [
      'FROM node:20-alpine',
      'WORKDIR /app',
      'COPY . .',
      hasLock ? 'RUN npm ci' : (hasPkg ? 'RUN npm install --omit=dev' : ''),
      `CMD ["node","${entrypoint.replace(/\\/g,'/')}"]`,
      '',
    ].filter(Boolean).join('\n')
  }
  if (runtime === 'deno') {
    return [
      'FROM denoland/deno:alpine',
      'WORKDIR /app',
      'COPY . .',
      `CMD ["deno","run","--allow-net","--allow-env","${entrypoint.replace(/\\/g,'/')}"]`,
      '',
    ].join('\n')
  }
  throw new Error(`Unsupported runtime: ${runtime}`)
}

async function buildGraduateBundle({ clusterPath, outDir, strict }) {
  const clusterRaw = await fsp.readFile(clusterPath, 'utf8')
  const cluster = JSON.parse(clusterRaw)
  if (!cluster || typeof cluster !== 'object') throw new Error('cluster.json must be an object')
  if (!Array.isArray(cluster.agents) || cluster.agents.length === 0) throw new Error('cluster.json must include non-empty agents[]')

  await fsp.mkdir(outDir, { recursive: true })
  const agentsOutDir = path.join(outDir, 'agents')
  await fsp.mkdir(agentsOutDir, { recursive: true })

  const seenPorts = new Map()
  const services = {}
  const agents = []

  for (const a of cluster.agents) {
    const name = a.name
    const manifestPath = path.resolve(path.dirname(clusterPath), a.manifest_path)
    const agentDir = path.dirname(manifestPath)
    const memory = a.memory ?? 'none'

    const { passed, strictErrors, manifest } = validateAgent(agentDir, { strict: !!strict, seenPorts })
    if (!passed) throw new Error(`manifest invalid for agent '${name}'`)
    if (strict && strictErrors > 0) throw new Error(`strict validation failed for agent '${name}'`)
    if (manifest.name !== name) throw new Error(`cluster agent name '${name}' does not match manifest.name '${manifest.name}'`)

    const destDir = path.join(agentsOutDir, name)
    await fsp.rm(destDir, { recursive: true, force: true })
    await fsp.cp(agentDir, destDir, { recursive: true })

    const dockerfileName = `Dockerfile.${name}`
    const dockerfilePath = path.join(outDir, dockerfileName)
    await fsp.writeFile(dockerfilePath, dockerfileFor(manifest.runtime, manifest.entrypoint, agentDir), 'utf8')

    const env = [`AGENT_ID=${name}`]
    if (manifest.mcp_compatible) env.push(`PORT=${manifest.port}`)
    if (memory === 'redis') env.push('REDIS_URL=redis://redis:6379')
    if (memory === 'postgres') env.push('DATABASE_URL=postgresql://postgres:hypercode@postgres:5432/hypercode')

    const svc = {
      build: { context: `./agents/${name}`, dockerfile: `./${dockerfileName}` },
      environment: env,
      networks: ['agents-net'],
    }
    if (manifest.mcp_compatible) {
      svc.ports = [`127.0.0.1:${manifest.port}:${manifest.port}`]
    }
    services[`agent-${name}`] = svc

    agents.push({
      name,
      runtime: manifest.runtime,
      port: manifest.mcp_compatible ? manifest.port : null,
      memory,
    })
  }

  const compose = { services, networks: { 'agents-net': {} } }
  await fsp.writeFile(path.join(outDir, 'docker-compose.agents.yml'), dumpYaml(compose), 'utf8')

  const readme = [
    '# HyperAgent Graduate Bundle',
    '',
    '## Run (standalone)',
    '```bash',
    'docker compose -f docker-compose.agents.yml up -d --build',
    '```',
    '',
    '## Join HyperCode V2.4 network',
    'Find the real network name:',
    '```bash',
    'docker network ls | findstr agents-net',
    '```',
    '',
    'Then edit `docker-compose.agents.yml` to:',
    '```yaml',
    'networks:',
    '  agents-net:',
    '    external: true',
    '    name: hypercode-v2-4_agents-net',
    '```',
    '',
  ].join('\n')
  await fsp.writeFile(path.join(outDir, 'README.md'), readme, 'utf8')

  return { outDir, cluster: cluster.cluster ?? null, agents }
}

module.exports = { buildGraduateBundle }
```

- [ ] **Step 4: Run tests**

Run:
```bash
npm test
```
Expected: PASS for the new tests (and existing tests still green).

- [ ] **Step 5: Commit**

```bash
git add cli/lib/graduateBuild.js tests/graduate-build.test.js
git commit -m "feat(sdk): add graduate build bundle generator"
```

---

### Task 3: Upgrade `graduate` command into a router (`build` + `trigger`)

**Files:**
- Modify: `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/cli/commands/graduate.js`
- Modify: `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/cli/index.js`
- Test: `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/tests/graduate-build.test.js`

- [ ] **Step 1: Add tests for secret fallback chain**

```js
const test = require('node:test')
const assert = require('node:assert/strict')

test('graduate trigger prefers COURSE_SYNC_SECRET over SHOP_SYNC_SECRET', async () => {
  const { run } = require('../cli/commands/graduate')

  process.env.HYPERCODE_API_URL = 'http://example.invalid'
  process.env.COURSE_SYNC_SECRET = 'course-secret'
  process.env.SHOP_SYNC_SECRET = 'shop-secret'

  let seenHeader = null
  const originalFetch = global.fetch
  global.fetch = async (url, opts) => {
    seenHeader = opts.headers['X-Sync-Secret']
    return { ok: true, status: 200, json: async () => ({ ok: true }) }
  }

  await run(['trigger', '123', '--json'])
  global.fetch = originalFetch

  assert.equal(seenHeader, 'course-secret')
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:
```bash
npm test
```
Expected: FAIL until `graduate.js` implements the new routing + secret selection.

- [ ] **Step 3: Implement the router**

Required behavior:
- `graduate build <cluster.json> --out <dir> [--strict] [--json]`
  - calls `buildGraduateBundle({ clusterPath, outDir, strict })`
  - prints human summary or JSON summary
- `graduate trigger <discord_id> [--tokens 500] [--json]`
  - current behavior but:
    - secret = `process.env.COURSE_SYNC_SECRET || process.env.SHOP_SYNC_SECRET || ''`
- Backward compatibility:
  - `hyper-agent graduate <discord_id>` should behave like `trigger`

Suggested argument parsing:
```js
const cmd = args[0]
const sub = (cmd === 'build' || cmd === 'trigger') ? cmd : 'trigger'
const rest = sub === 'trigger' && cmd !== 'trigger' ? args : args.slice(1)
```

- [ ] **Step 4: Update CLI help**

Update usage lines in `cli/index.js` for:
- `hyper-agent graduate build <cluster.json> --out out/ [--strict] [--json]`
- `hyper-agent graduate trigger <discord_id> [--tokens 500] [--json]`

- [ ] **Step 5: Run tests**

Run:
```bash
npm test
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add cli/commands/graduate.js cli/index.js tests/graduate-build.test.js
git commit -m "feat(sdk): add graduate build/trigger subcommands"
```

---

### Task 4: Update docs drift in README (if needed)

**Files:**
- Modify: `h:/HYPERFOCUSZONE/HperCore/HyperAgent-SDK/README.md`

- [ ] Replace any “npm run graduate” references with:
  - `hyper-agent graduate build`
  - `hyper-agent graduate trigger`

- [ ] Commit

```bash
git add README.md
git commit -m "docs(sdk): align README with graduate build/trigger"
```

---

## Plan Self-Review (coverage)
- Spec requirements covered:
  - `build` output layout: Task 2
  - Single shared compose file: Task 2 (compose emitter + file write)
  - Per-runtime Dockerfiles: Task 2 (`dockerfileFor`)
  - Fail-fast: Task 2 (strict validation + mismatch checks) + Task 3 (router errors)
  - Secret fallback chain: Task 3 + test
  - README network snippet: Task 2 README content

