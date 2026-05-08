---
name: hypercode-sdk
description: HyperAgent-SDK development, publishing, and spec validation. Use when working on the SDK CLI, adding new commands, publishing to npm, updating the hyper-agent-spec.json schema, adding new templates, or debugging SDK validation errors. Latest shipped: v0.3.0 — Phase 3 token sync client (awardFromCourse).
---

# HyperAgent-SDK Skill

The hub skill for the SDK. For specific workflows, route to the focused skills below.

## Companion Skills (in this folder)

| Skill | When to use |
|---|---|
| `sdk-publish` | Shipping a new version to npm — full gated workflow |
| `cross-repo-sync` | Changing `hyper-agent-spec.json` or `awardFromCourse` contract — keep SDK / V2.4 / Course aligned |
| `phase-4-graduation` | Building/debugging the `graduate` flagship feature |
| `token-sync-debug` | Triaging `awardFromCourse()` failures (401/409/timeout/etc.) |
| `test-status-report` | Running tests + producing a structured status report |

## Phase Status

| Phase | Status |
|---|---|
| Phase 2 — Starter pack expansion (init + 4 templates + validator UX) | ✅ 0.2.0 shipped |
| Phase 3 — Token sync client (`awardFromCourse`) | ✅ 0.3.0 shipped |
| Phase 4 — Graduation flagship (`graduate` CLI + V2.4 hooks + Discord) | ⏳ NEXT |
| Phase 5 — Public registry surface | 🔜 |
| Phase 6 — Ops commands (`status`, `logs`, `tokens`, `agents`) | ✅ live (foundational) |

## Current State (snapshot)

- **Version:** 0.3.0 — shipped April 30, 2026
- **npm package:** `@w3lshdog/hyper-agent`
- **Tests:** 57/57 passing (`node --test`)
- **TypeScript types:** `types/index.d.ts` covers all 3 subpath exports
- **Subpath exports:** `.`, `./registry`, `./client`
- **Runtime deps:** `ajv`, `ajv-formats` only — keep it lean

## CLI Commands (routed through `cli/index.js`)

| Command | What it does |
|---------|-------------|
| `init <dir> --template <name>` | 0.2.0 — Scaffold from python\|node\|typescript\|mcp templates |
| `validate <dir> [--strict]` | Validates agent manifest with human-readable AJV hints |
| `registry build\|search\|show` | Builds/searches agent registry with auto-computed badges |
| `studio` | Launches Studio GUI at localhost:4040 |
| `memory check` | Redis/Postgres health check |
| `status` | Shows all 29 V2.4 container statuses |
| `agents list` | Lists agent heartbeats from V2.4 |
| `tokens award <discord_id> <amount>` | Awards BROski$ tokens (CLI → V2.4) |
| `graduate <discord_id>` | Triggers student graduation in V2.4 (Phase 4) |
| `logs --tail N` | Streams recent logs from V2.4 |

## Library API (subpath exports)

```javascript
// Manifest validation
const { validateAgent } = require('@w3lshdog/hyper-agent');

// Registry + badges
const { computeBadges, BADGE_RULES } = require('@w3lshdog/hyper-agent/registry');

// Phase 3 — Course → V2.4 token sync (SERVER-ONLY)
const { awardFromCourse, AwardFromCourseError } = require('@w3lshdog/hyper-agent/client');
```

### awardFromCourse — quick shape

```javascript
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

For deeper debug → use the `token-sync-debug` skill.

## Common Gotchas (don't re-debate these)

- **AJV strict mode rejects `errorMessage`** — never put it in the `then` block of `hyper-agent-spec.json` unless you also install `ajv-errors`. We don't.
- **`awardFromCourse` refuses to run in a browser** — it checks `typeof window !== 'undefined'`. Never import `@w3lshdog/hyper-agent/client` from a client component.
- **Scoped npm package needs `--access public`** — `npm publish --access public` always. Without the flag, npm assumes private and 402s.
- **MCP port collisions** — MCP-compatible agents must declare a port in 3100–3999. Validator catches duplicates within a registry.
- **Spec changes are cross-repo events** — touching `hyper-agent-spec.json` means SDK + V2.4 + Course all need updates (use `cross-repo-sync` skill).
- **`mcp_compatible: true` requires `port`** — enforced via JSON Schema `if/then` block (no `errorMessage` keyword though).
- **Windows PowerShell first** — all skill commands ship with PowerShell syntax.

## Key Files

```
cli/index.js          ← CLI router, 9 commands
cli/validate.js       ← AJV schema validation + human error hints
cli/registry.js       ← Registry + 7 badge rules, exports BADGE_RULES
cli/client.js         ← 0.3.0 — awardFromCourse() + AwardFromCourseError
cli/memory.js         ← Redis/Postgres health checks
cli/studio.js         ← HTTP server at :4040
cli/commands/init.js  ← 0.2.0 — template scaffolder
cli/commands/graduate.js ← Phase 4 graduate trigger (POSTs /api/v1/graduate/trigger)
cli/commands/{status,logs,tokens,agents}.js ← Phase 6 ops commands
types/index.d.ts      ← TypeScript definitions for all 3 subpaths
hyper-agent-spec.json ← Shared schema contract (Course + V2.4 + SDK)
templates/{python,node,typescript,mcp}-starter/
tests/{validate,registry,init,client}.test.js (21+15+7+14 = 57)
```

## hyper-agent-spec.json — Required Fields

```json
{
  "name": "my-agent",           // kebab-case, 3-50 chars
  "version": "0.1.0",           // semver
  "runtime": "python",          // python | node | deno
  "entrypoint": "main.py",
  "tools": [{                   // min 1 tool required
    "name": "tool_name",        // snake_case, 3-64 chars
    "description": "...",       // max 300 chars
    "input_schema": {}          // JSON Schema object
  }],
  "mcp_compatible": false
}
```

If `mcp_compatible: true` → `port` required (3100-3999).

## Badge Rules (auto-computed by `cli/registry.js`)

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

## Port Convention (MCP agents)

```
3100-3199 → Writing agents
3200-3299 → Code agents       ← mcp-starter uses 3200
3300-3399 → Data agents
3400-3499 → Discord agents
3500-3599 → Automation agents
```

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

## Adding a New Template

```
templates/<name>-starter/
  manifest.json   ← valid per hyper-agent-spec.json
  <entrypoint>
  package.json    ← if runtime=node
  requirements.txt ← if runtime=python
```

Then:
1. Add the alias to `TEMPLATES` in `cli/commands/init.js`
2. Add a test in `tests/validate.test.js` (`built-in templates` describe block)
3. Add a test in `tests/init.test.js`
4. Update `package.json` `test:templates` script

## Adding a New Library Export

1. Write the module under `cli/<name>.js`
2. Add to `package.json` `exports`: `"./mything": "./cli/mything.js"`
3. Add types to `types/index.d.ts`
4. Add tests under `tests/<name>.test.js`

## Connect CLI to Local V2.4

```powershell
$env:HYPERCODE_API_URL = "http://localhost:8000"
node cli/index.js status       # 29 containers
node cli/index.js agents list
node cli/index.js logs --tail 20
```

## Cross-Repo Contract

The SDK is the canonical source of:
- `hyper-agent-spec.json` — manifest schema (consumed by V2.4 + Course)
- `awardFromCourse()` — Course → V2.4 token sync helper (Phase 3)
- The `/api/v1/graduate/trigger` payload shape (Phase 4)

When changing any of these → use the `cross-repo-sync` skill.
