---
name: hypercode-sdk
description: HyperAgent-SDK development, publishing, and spec validation. Use when working on the SDK CLI, adding new commands, publishing to npm, updating the hyper-agent-spec.json schema, adding new templates, or debugging SDK validation errors. Version 0.1.7 is ready to publish right now.
---

# HyperAgent-SDK Skill

## Current State
- **Version:** 0.1.7 — READY TO PUBLISH
- **npm package:** `@w3lshdog/hyper-agent`
- **Tests:** 34/34 passing (node --test)
- **TypeScript types:** Live in `types/index.d.ts`

## Publish Right Now

```powershell
cd "H:\HyperAgent-SDK"
npm test              # verify 34/34 pass first
npm publish --access public
# Then verify:
npx @w3lshdog/hyper-agent validate ./templates/node-starter
```

## CLI Commands (all in cli/index.js)

| Command | What it does |
|---------|-------------|
| `validate <dir>` | Validates agent manifest against hyper-agent-spec.json |
| `registry` | Builds/searches agent registry with auto-computed badges |
| `studio` | Launches Studio GUI at localhost:4040 |
| `status` | Shows all 29 V2.4 container statuses |
| `agents` | Lists agent heartbeats from V2.4 |
| `tokens <discord_id> <amount>` | Awards BROski$ tokens |
| `graduate <source_id>` | Triggers student graduation in V2.4 |
| `logs --tail N` | Streams recent logs from V2.4 |

## Key Files

```
cli/index.js         ← CLI router, 8 commands
cli/validate.js      ← AJV schema validation (248 lines)
cli/registry.js      ← Registry + 7 badge rules (388 lines)
cli/memory.js        ← Redis/Postgres health checks
cli/studio.js        ← HTTP server at :4040
cli/commands/        ← Phase 6 commands (graduate, status, logs, tokens, agents)
types/index.d.ts     ← TypeScript definitions
hyper-agent-spec.json ← The shared schema contract
templates/
  node-starter/      ← Node.js agent template
  python-starter/    ← Python agent template
```

## hyper-agent-spec.json — Required Fields

```json
{
  "name": "my-agent",           // kebab-case, 3-50 chars
  "version": "0.1.0",           // semver
  "runtime": "python",          // python | node | deno
  "entrypoint": "main.py",      // path to entry file
  "tools": [{                   // min 1 tool required
    "name": "tool_name",        // snake_case, 3-64 chars
    "description": "...",       // max 300 chars
    "input_schema": {}          // JSON Schema object
  }],
  "mcp_compatible": false       // boolean
}
```

If `mcp_compatible: true` → `port` is required (range 3100-3999)

## Badge Rules (auto-computed by registry.js)

```
✅ Verified      → manifest.verified: true (manual override)
⚡ MCP Ready     → mcp_compatible: true
🧠 Memory Enabled → memory !== 'none'
🔧 Multi-Tool    → tools.length >= 3
🔐 Env Declared  → env_vars.length > 0
🚀 HyperCoder    → course_level >= 4
👑 Elite         → course_level >= 5
💚 Health Checked → health_check defined
```

## Port Convention (for MCP-compatible agents)

```
3100-3199 → Writing agents
3200-3299 → Code agents
3300-3399 → Data agents
3400-3499 → Discord agents
3500-3599 → Automation agents
```

Validate port conflicts: `node cli/index.js validate --strict ./my-agent`

## Adding a New CLI Command

```javascript
// cli/commands/mycommand.js
const { HYPERCODE_API_URL } = process.env

async function myCommand(args) {
  const url = HYPERCODE_API_URL || 'http://localhost:8000'
  const res = await fetch(`${url}/api/v1/my-endpoint`)
  const data = await res.json()
  console.log(data)
}

module.exports = { myCommand }

// Then in cli/index.js, add to the switch:
case 'mycommand':
  const { myCommand } = require('./commands/mycommand')
  await myCommand(args.slice(1))
  break
```

## Adding a New Template (e.g. Deno)

```
templates/deno-starter/
  manifest.json   ← valid per hyper-agent-spec.json
  main.ts         ← Deno TypeScript entry point
  README.md
```

Verify: `node cli/index.js validate ./templates/deno-starter`
Add test in `tests/validate.test.js`

## Running Tests

```bash
npm test
# or
node --test tests/*.test.js

# Expected: 34 tests pass, 0 fail
```

## Connect CLI to Local V2.4

```powershell
$env:HYPERCODE_API_URL = "http://localhost:8000"
node cli/index.js status       # shows 29 containers
node cli/index.js agents list  # shows agent heartbeats
node cli/index.js logs --tail 20
```

## Version Bump Workflow

```bash
npm version patch   # 0.1.7 → 0.1.8
git push --tags
npm publish --access public
```
