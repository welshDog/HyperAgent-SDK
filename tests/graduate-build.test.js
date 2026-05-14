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

test('buildGraduateBundle defaults memory to none when omitted', async () => {
  const fs = require('node:fs')
  const fsp = require('node:fs/promises')
  const os = require('node:os')
  const path = require('node:path')

  const { buildGraduateBundle } = require('../cli/lib/graduateBuild')

  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'hyperagent-sdk-'))
  const agentDir = path.join(root, 'a1a')
  await fsp.mkdir(agentDir, { recursive: true })

  await fsp.writeFile(
    path.join(agentDir, 'manifest.json'),
    JSON.stringify(
      {
        name: 'a1a',
        version: '0.1.0',
        runtime: 'node',
        entrypoint: 'index.js',
        tools: [{ name: 'do_thing', description: 'x', input_schema: {} }],
        mcp_compatible: false,
      },
      null,
      2
    ),
    'utf8'
  )
  await fsp.writeFile(path.join(agentDir, 'index.js'), 'console.log("ok")', 'utf8')
  await fsp.writeFile(path.join(agentDir, 'package.json'), JSON.stringify({ name: 'a1a', version: '0.1.0' }), 'utf8')

  const clusterPath = path.join(root, 'cluster.json')
  await fsp.writeFile(
    clusterPath,
    JSON.stringify(
      {
        cluster: 'c',
        agents: [{ name: 'a1a', manifest_path: path.join(agentDir, 'manifest.json') }],
      },
      null,
      2
    ),
    'utf8'
  )

  const outDir = path.join(root, 'out')
  const result = await buildGraduateBundle({ clusterPath, outDir, strict: true })

  assert.equal(result.agents[0].memory, 'none')
  assert.equal(fs.existsSync(path.join(outDir, 'docker-compose.agents.yml')), true)
  assert.equal(fs.existsSync(path.join(outDir, 'Dockerfile.a1a')), true)
  assert.equal(fs.existsSync(path.join(outDir, 'README.md')), true)
})

test('graduate trigger prefers COURSE_SYNC_SECRET over SHOP_SYNC_SECRET', async () => {
  const { run } = require('../cli/commands/graduate')

  process.env.HYPERCODE_API_URL = 'http://example.invalid'
  process.env.COURSE_SYNC_SECRET = 'course-secret'
  process.env.SHOP_SYNC_SECRET = 'shop-secret'

  let seenHeader = null
  const originalFetch = global.fetch
  global.fetch = async (_url, opts) => {
    seenHeader = opts.headers['X-Sync-Secret']
    return { ok: true, status: 200, json: async () => ({ ok: true }) }
  }

  await run(['trigger', '123', '--json'])
  global.fetch = originalFetch

  assert.equal(seenHeader, 'course-secret')
})
