const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')

const { validateAgent } = require('../validate')
const { dumpYaml } = require('./yaml')

function normalizeEntrypoint(entrypoint) {
  return String(entrypoint).replace(/\\/g, '/')
}

function dockerfileFor(runtime, entrypoint, agentDir) {
  const ep = normalizeEntrypoint(entrypoint)

  if (runtime === 'python') {
    const hasReq = fs.existsSync(path.join(agentDir, 'requirements.txt'))
    const lines = [
      'FROM python:3.11-slim',
      'WORKDIR /app',
      'COPY . .',
      hasReq ? 'RUN pip install --no-cache-dir -r requirements.txt' : null,
      `CMD ["python","${ep}"]`,
      '',
    ]
    return lines.filter(Boolean).join('\n')
  }

  if (runtime === 'node') {
    const hasLock = fs.existsSync(path.join(agentDir, 'package-lock.json'))
    const hasPkg = fs.existsSync(path.join(agentDir, 'package.json'))
    const install = hasLock ? 'RUN npm ci' : hasPkg ? 'RUN npm install --omit=dev' : null
    const lines = [
      'FROM node:20-alpine',
      'WORKDIR /app',
      'COPY . .',
      install,
      `CMD ["node","${ep}"]`,
      '',
    ]
    return lines.filter(Boolean).join('\n')
  }

  if (runtime === 'deno') {
    return [
      'FROM denoland/deno:alpine',
      'WORKDIR /app',
      'COPY . .',
      `CMD ["deno","run","--allow-net","--allow-env","${ep}"]`,
      '',
    ].join('\n')
  }

  throw new Error(`Unsupported runtime: ${runtime}`)
}

async function readJsonFile(filePath) {
  const raw = await fsp.readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0
}

async function buildGraduateBundle({ clusterPath, outDir, strict }) {
  if (!isNonEmptyString(clusterPath)) throw new Error('clusterPath is required')
  if (!isNonEmptyString(outDir)) throw new Error('outDir is required')

  const clusterAbsPath = path.resolve(clusterPath)
  const clusterDir = path.dirname(clusterAbsPath)
  const cluster = await readJsonFile(clusterAbsPath)

  if (!cluster || typeof cluster !== 'object') throw new Error('cluster.json must be an object')
  if (!Array.isArray(cluster.agents) || cluster.agents.length === 0) throw new Error('cluster.json must include non-empty agents[]')

  const outAbsDir = path.resolve(outDir)
  const agentsOutDir = path.join(outAbsDir, 'agents')
  await fsp.mkdir(agentsOutDir, { recursive: true })

  const seenPorts = new Map()
  const services = {}
  const agents = []
  const files = []

  for (const agent of cluster.agents) {
    if (!agent || typeof agent !== 'object') throw new Error('cluster.agents[] must be objects')
    if (!isNonEmptyString(agent.name)) throw new Error('cluster.agents[] missing name')
    if (!isNonEmptyString(agent.manifest_path)) throw new Error(`cluster agent '${agent.name}' missing manifest_path`)

    const agentName = agent.name.trim()
    const memory = isNonEmptyString(agent.memory) ? agent.memory : 'none'

    const manifestAbsPath = path.resolve(clusterDir, agent.manifest_path)
    const agentDir = path.dirname(manifestAbsPath)

    const validated = validateAgent(agentDir, { strict: !!strict, seenPorts })
    if (!validated.passed || !validated.manifest) throw new Error(`manifest invalid for agent '${agentName}'`)
    if (strict && validated.strictErrors > 0) throw new Error(`strict validation failed for agent '${agentName}'`)

    const manifest = validated.manifest
    if (manifest.name !== agentName) throw new Error(`cluster agent name '${agentName}' does not match manifest.name '${manifest.name}'`)

    const agentDestDir = path.join(agentsOutDir, agentName)
    await fsp.rm(agentDestDir, { recursive: true, force: true })
    await fsp.cp(agentDir, agentDestDir, { recursive: true })
    files.push(path.join('agents', agentName))

    const dockerfileName = `Dockerfile.${agentName}`
    const dockerfileAbsPath = path.join(outAbsDir, dockerfileName)
    await fsp.writeFile(dockerfileAbsPath, dockerfileFor(manifest.runtime, manifest.entrypoint, agentDir), 'utf8')
    files.push(dockerfileName)

    const env = [`AGENT_ID=${agentName}`]
    if (manifest.mcp_compatible) env.push(`PORT=${manifest.port}`)
    if (memory === 'redis') env.push('REDIS_URL=redis://redis:6379')
    if (memory === 'postgres') env.push('DATABASE_URL=postgresql://postgres:hypercode@postgres:5432/hypercode')

    const service = {
      build: { context: `./agents/${agentName}`, dockerfile: `./${dockerfileName}` },
      environment: env,
      networks: ['agents-net'],
    }

    if (manifest.mcp_compatible) {
      service.ports = [`127.0.0.1:${manifest.port}:${manifest.port}`]
    }

    services[`agent-${agentName}`] = service

    agents.push({
      name: agentName,
      runtime: manifest.runtime,
      port: manifest.mcp_compatible ? manifest.port : null,
      memory,
    })
  }

  const compose = {
    services,
    networks: { 'agents-net': {} },
  }
  const composePath = path.join(outAbsDir, 'docker-compose.agents.yml')
  await fsp.writeFile(composePath, dumpYaml(compose), 'utf8')
  files.push('docker-compose.agents.yml')

  const readmePath = path.join(outAbsDir, 'README.md')
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
  await fsp.writeFile(readmePath, readme, 'utf8')
  files.push('README.md')

  return {
    outDir: outAbsDir,
    cluster: isNonEmptyString(cluster.cluster) ? cluster.cluster : null,
    agents,
    files,
  }
}

module.exports = { buildGraduateBundle }

