---
name: cross-repo-sync
description: Keep the cross-repo contracts (hyper-agent-spec.json + awardFromCourse + graduate trigger) aligned across HyperAgent-SDK, HyperCode-V2.4, and Hyper-Vibe-Coding-Course. Use when changing manifest schema, adding/changing fields, modifying the Course→V2.4 token sync payload, the graduate API shape, or whenever the user says "spec change", "sync with V2.4", "update Course", or "the three repos drifted".
---

# cross-repo-sync

The SDK is the canonical source for three cross-repo contracts. Changing any of them = a coordinated update across all three repos in lockstep.

## The Three Contracts (and where they live)

| Contract | Canonical file (SDK) | Mirrored in V2.4 | Mirrored in Course |
|---|---|---|---|
| Agent manifest schema | `hyper-agent-spec.json` | Validator service / agent registry | Course agent submission UI |
| `awardFromCourse` payload | `cli/client.js` (`awardFromCourse`) | `POST /api/v1/economy/award-from-course` handler | Edge function calling the SDK helper |
| `graduate` payload | `cli/commands/graduate.js` | `POST /api/v1/graduate/trigger` handler | Course graduation flow trigger |

## Repo Paths

```
SDK:    H:\HyperAgent-SDK
V2.4:   H:\HyperStation zone\HyperCode\HyperCode-V2.4
Course: H:\the hyper vibe coding hub
```

## Rule: SDK Changes First, Then Mirror

1. Land the change in the SDK (with bumped tests + types).
2. Open both sister repos.
3. Mirror in V2.4 (server side).
4. Mirror in Course (consumer side).
5. End-to-end test the round trip.
6. Bump SDK version + ship via `sdk-publish` skill.

## Contract 1 — `hyper-agent-spec.json` (Manifest Schema)

When you add/remove/change a field:

**SDK side** (`H:\HyperAgent-SDK`):
- Edit `hyper-agent-spec.json`
- Update `types/index.d.ts` → `HyperAgentManifest` interface
- Update `cli/validate.js` if you added a custom human-error hint
- Update `cli/registry.js` if the new field affects badges
- Add tests in `tests/validate.test.js`
- Update affected templates under `templates/*-starter/manifest.json`
- Run `npm test` → expect 57+ green
- Run `npm run test:templates` → all 4 templates still valid

**V2.4 side** (`H:\HyperStation zone\HyperCode\HyperCode-V2.4`):
- Mirror the field in the agent registry validator
- Update DB schema if the field is persisted (Alembic migration)
- Update `/api/v1/agents/*` response shape
- Update Grafana dashboards if the new field is visualized

**Course side** (`H:\the hyper vibe coding hub`):
- Update agent submission form (Vercel/Supabase frontend)
- Mirror in any Supabase functions that read manifest data
- Update preview/validation UI to handle the new field

**Hard rules:**
- **AJV strict mode** — never add `errorMessage` to `then` blocks (we don't ship `ajv-errors`)
- **`mcp_compatible: true` ⇒ `port` required** — keep this `if/then` invariant
- **Breaking change → MAJOR bump** (e.g. removing a field, tightening a constraint)

## Contract 2 — `awardFromCourse` Payload (Phase 3)

The SDK helper POSTs to `${baseUrl}/api/v1/economy/award-from-course` with this exact shape:

```json
{
  "source_id":  "string ≤128 chars (idempotency key)",
  "discord_id": "string ≤32 chars",
  "tokens":     <integer 1..10000>,
  "reason":     "string ≤255 chars (default 'Course reward')"
}
```

Headers: `Content-Type: application/json`, `X-Sync-Secret: <COURSE_SYNC_SECRET>`.

**SDK side**:
- Edit `cli/client.js` — `validateInput()` + the body builder
- Update `types/index.d.ts` → `AwardFromCourseInput` / `AwardFromCourseResult`
- Bump tests in `tests/client.test.js` (currently 14)

**V2.4 side**:
- Update the `/api/v1/economy/award-from-course` FastAPI route handler
- Update the Pydantic request model + response model
- Confirm idempotency table column lengths match (e.g. `source_id` ≤128)
- Verify `X-Sync-Secret` middleware still validates

**Course side**:
- Where the helper is imported (server-side only — typically a Supabase Edge Function or Vercel API route), update the call site
- Confirm `COURSE_SYNC_SECRET` env var is still set in Vercel + Supabase secrets

**Round-trip test:**
```powershell
# In SDK with V2.4 running on :8000
$env:HYPERCODE_API_URL  = "http://localhost:8000"
$env:COURSE_SYNC_SECRET = "<the-shared-secret>"
node -e "require('H:/HyperAgent-SDK/cli/client').awardFromCourse({sourceId:'test_'+Date.now(),discordId:'123456789012345678',tokens:1,reason:'sync test'}).then(r=>console.log('OK',r)).catch(e=>{console.error('FAIL',e.code,e.message);process.exit(1)})"
```

Expected: `OK { source_id, awarded: 1, coins_balance, xp_balance, level }`

## Contract 3 — `graduate` Payload (Phase 4)

`cli/commands/graduate.js` POSTs to `${baseUrl}/api/v1/graduate/trigger` with:

```json
{
  "discord_id":     "string",
  "source_id":      "cli_graduate_<discord_id>_<ts>",
  "badge_slug":     "hyper-graduate",
  "tokens_awarded": 500
}
```

Headers: `Content-Type: application/json`, `X-Sync-Secret: <SHOP_SYNC_SECRET>`.

Response (200): `{ badge_slug, tokens_awarded, portfolio_url, discord_role_assigned }`. 409 = already graduated.

**Heads up — different secret env var:** `SHOP_SYNC_SECRET` (not `COURSE_SYNC_SECRET`). Keep this distinction in V2.4's middleware.

When changing this contract → mirror in V2.4's graduate router + Course's graduation trigger flow.

## Drift Detection (quick audit)

When unsure if the three repos are aligned, spot-check:

```powershell
# 1. Read the source-of-truth from SDK
cd "H:\HyperAgent-SDK"
Get-Content hyper-agent-spec.json | Select-String '"required"|"port"|"mcp_compatible"'

# 2. Find the V2.4 mirror (search for the relevant route or model)
cd "H:\HyperStation zone\HyperCode\HyperCode-V2.4"
# (use your file search to locate `award-from-course`, `graduate/trigger`, manifest validator)

# 3. Find the Course mirror
cd "H:\the hyper vibe coding hub"
# (search for awardFromCourse import + graduation trigger)
```

If a field exists in SDK but not in V2.4 — that's drift. Mirror it.

## Versioning Discipline

- **Additive change** (new optional field, new endpoint) → MINOR bump
- **Breaking change** (removed field, type change, tighter constraint) → MAJOR bump + write migration notes in `AGENT_SYNC_NOTES.md`
- Always update all three repos in the same week — don't let drift compound

## When in Doubt

If you're not sure whether your edit affects another repo, ask Bro:
> "This change touches `<file>` — is this a cross-repo contract? Should I mirror to V2.4 / Course?"

Better to ask once than to ship drift.
