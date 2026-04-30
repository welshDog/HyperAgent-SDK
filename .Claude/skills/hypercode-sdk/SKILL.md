---
name: hypercode-sdk
description: HyperAgent-SDK development, publishing, and spec validation. Use when working on the SDK CLI, adding new commands, publishing to npm, updating the hyper-agent-spec.json schema, adding new templates, or debugging SDK validation errors. Latest shipped: v0.3.0 — Phase 3 token sync client (awardFromCourse).
---

# HyperAgent-SDK Skill

## Current State
- **Version:** 0.3.0 — shipped April 30, 2026
- **npm package:** `@w3lshdog/hyper-agent`
- **Tests:** 57/57 passing (`node --test`)
- **TypeScript types:** `types/index.d.ts` covers all 3 subpath exports
- **Subpath exports:** `.`, `./registry`, `./client`

## Publish Workflow

```powershell
cd "H:\HyperAgent-SDK"
npm test                          # verify 57/57 pass first
git add -A && git commit -m "..."
npm version minor                 # patch | minor | major
git push --follow-tags
npm publish --access public
# Verify:
npx @w3lshdog/hyper-agent init my-bot --template python
```

## CLI Commands (all routed through cli/index.js)

| Command | What it does |
|---------|-------------|
| `init <dir> --template <name>` | **NEW 0.2.0** — Scaffold from python\|node\|typescript\|mcp templates |
| `validate <dir> [--strict]` | Validates agent manifest with human-readable AJV hints |
| `registry build\|search\|show` | Builds/searches agent registry with auto-computed badges |
| `studio` | Launches Studio GUI at localhost:4040 |
| `memory check` | Redis/Postgres health check |
| `status` | Shows all 29 V2.4 container statuses |
| `agents list` | Lists agent heartbeats from V2.4 |
| `tokens award <discord_id> <amount>` | Awards BROski$ tokens (CLI → V2.4) |
| `graduate <discord_id>` | Triggers student graduation in V2.4 |
| `logs --tail N` | Streams recent logs from V2.4 |

## Library API (the part consumed by other repos)

```javascript
// Manifest validation
const { validateAgent } = require('@w3lshdog/hyper-agent');

// Registry + badges
const { computeBadges, BADGE_RULES } = require('@w3lshdog/hyper-agent/registry');

// Phase 3 — Course → V2.4 token sync (SERVER-ONLY)
const { awardFromCourse, AwardFromCourseError } = require('@w3lshdog/hyper-agent/client');
```

### awardFromCourse — Phase 3 Token Sync

```javascript
// Course repo (Vercel/Supabase Edge Function) calls this server-side:
const result = await awardFromCourse({
  sourceId:  txn.id,                  // ≤128 chars, idempotency key
  discordId: user.discord_id,         // ≤32 chars
  tokens:    50,                      // integer 1..10000
  reason:    'Course module complete' // optional, ≤255 chars
});
// → 200: { source_id, awarded, coins_balance, xp_balance, level }
// → 409: { source_id, duplicate: true, detail }    (idempotent replay)
// → throw AwardFromCourseError                     (validation/timeout/4xx/5xx)
```

Defaults: `baseUrl=process.env.HYPERCODE_API_URL || http://localhost:8000`,
`secret=process.env.COURSE_SYNC_SECRET`, `timeoutMs=5000`.
**Refuses to run in browser** — `COURSE_SYNC_SECRET` is server-only.

## Key Files

```
cli/index.js          ← CLI router, 9 commands
cli/validate.js       ← AJV schema validation + human error hints
cli/registry.js       ← Registry + 7 badge rules, exports BADGE_RULES
cli/client.js         ← NEW 0.3.0 — awardFromCourse()
cli/memory.js         ← Redis/Postgres health checks
cli/studio.js         ← HTTP server at :4040
cli/commands/init.js  ← NEW 0.2.0 — template scaffolder
cli/commands/         ← Phase 6 commands (status, logs, tokens, agents, graduate)
types/index.d.ts      ← TypeScript definitions for all 3 subpaths
hyper-agent-spec.json ← Shared schema contract (Course + V2.4 + SDK)
templates/
  python-starter/     ← Python agent template
  node-starter/       ← Node.js agent template
  typescript-starter/ ← NEW 0.2.0 — TypeScript + tsconfig + tsx
  mcp-starter/        ← NEW 0.2.0 — MCP server, port 3200
tests/
  validate.test.js    ← 21 tests
  registry.test.js    ← 15 tests
  init.test.js        ← 7 tests (NEW 0.2.0)
  client.test.js      ← 14 tests (NEW 0.3.0)
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
✅ Verified       → manifest.verified: true (manual override)
⚡ MCP Ready      → mcp_compatible: true
🧠 Memory Enabled → memory !== 'none'
🔧 Multi-Tool     → tools.length >= 3
🔐 Env Declared   → env_vars.length > 0
🚀 HyperCoder     → course_level >= 4
👑 Elite          → course_level >= 5
💚 Health Checked → health_check defined
```

## Port Convention (for MCP-compatible agents)

```
3100-3199 → Writing agents
3200-3299 → Code agents       ← mcp-starter template uses 3200
3300-3399 → Data agents
3400-3499 → Discord agents
3500-3599 → Automation agents
```

Validate port conflicts: `node cli/index.js validate ./my-agent --strict`

## Adding a New CLI Command

```javascript
// cli/commands/mycommand.js
function run(args) {
  const baseUrl = process.env.HYPERCODE_API_URL || 'http://localhost:8000';
  // ... your logic
}
module.exports = { run };
```

Then add to `cli/index.js`:
```javascript
const SUBCOMMAND_DIR = ['init', 'status', 'logs', 'tokens', 'agents', 'graduate', 'mycommand'];
```

And to the `COMMANDS` map for the help banner.

## Adding a New Template

```
templates/<name>-starter/
  manifest.json   ← valid per hyper-agent-spec.json
  <entrypoint>    ← matches manifest.entrypoint
  package.json    ← if runtime=node
  requirements.txt ← if runtime=python
```

Then:
1. Add the alias to `TEMPLATES` in `cli/commands/init.js`
2. Add a test in `tests/validate.test.js` (`built-in templates` describe block)
3. Add a test in `tests/init.test.js` (verify scaffold works)
4. Update `package.json` `test:templates` script

## Adding a New Library Export

1. Write the module under `cli/<name>.js`
2. Add to `package.json` `exports`:
   ```json
   "./mything": "./cli/mything.js"
   ```
3. Add types to `types/index.d.ts`
4. Add tests under `tests/<name>.test.js`

## Running Tests

```bash
npm test
# or
node --test tests/*.test.js

# Expected: 57 tests pass, 0 fail
```

## Connect CLI to Local V2.4

```powershell
$env:HYPERCODE_API_URL = "http://localhost:8000"
node cli/index.js status       # shows 29 containers
node cli/index.js agents list  # shows agent heartbeats
node cli/index.js logs --tail 20
```

## Cross-Repo Contract (AGENT_SYNC_NOTES.md)

The SDK is the canonical source of:
- `hyper-agent-spec.json` — manifest schema (consumed by V2.4 + Course)
- `awardFromCourse()` — Course → V2.4 token sync helper (Phase 3)

Both V2.4 and Course must align with the SDK contract — when changing, update all three repos in lockstep.
