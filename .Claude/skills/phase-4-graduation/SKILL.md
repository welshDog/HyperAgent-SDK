---
name: phase-4-graduation
description: Build, extend, and debug the Phase 4 graduation flagship — the `hyper-agent graduate <discord_id>` CLI command, its V2.4 trigger endpoint, BROski$ token award, badge assignment, portfolio URL, and Discord role/DM. Use when the user says "phase 4", "graduate command", "graduation flow", "graduate failing", or wants to extend the 8-step graduation pipeline.
---

# phase-4-graduation

Phase 4 = the **flagship** student-graduation flow. The SDK CLI is the trigger; V2.4 does the heavy lifting; Discord receives the celebration.

## The 8-Step Pipeline (end-to-end)

```
Bro runs: hyper-agent graduate 123456789

  1. CLI validates discord_id arg + reads $env:HYPERCODE_API_URL + $env:SHOP_SYNC_SECRET
  2. CLI builds source_id = "cli_graduate_<discord_id>_<timestamp>"  (idempotency key)
  3. CLI POSTs to $baseUrl/api/v1/graduate/trigger with X-Sync-Secret header
  4. V2.4 verifies secret + checks: has user already graduated? (409 if yes)
  5. V2.4 awards N BROski$ tokens (default 500) — writes to token_transactions
  6. V2.4 assigns the "hyper-graduate" badge — writes to user_badges
  7. V2.4 generates portfolio_url + assigns Discord role + sends DM
  8. CLI prints celebration banner with all the goods
```

## Files Involved

### SDK (this repo)
- `cli/commands/graduate.js` — CLI handler. POSTs to `/api/v1/graduate/trigger`.
  - Default tokens: 500 (override with `--tokens 1000`)
  - Supports `--json` for machine-readable output
  - 409 → "already graduated" (idempotent)

### V2.4 (mirror — `H:\HyperStation zone\HyperCode\HyperCode-V2.4`)
- `POST /api/v1/graduate/trigger` route handler — does the work
- `X-Sync-Secret` middleware — validates `SHOP_SYNC_SECRET`
- Token award path → reuses the same internal helper as `award-from-course`
- Badge assignment path → `user_badges` table
- Discord integration → bot service (separate container)

### Course (consumer — `H:\the hyper vibe coding hub`)
- Optional auto-trigger from final-assessment-pass (calls the same V2.4 endpoint server-side)
- Learner-facing graduation page that polls/displays `portfolio_url` once issued

## CLI Contract (current shape)

```javascript
// cli/commands/graduate.js
POST ${baseUrl}/api/v1/graduate/trigger
  Headers: Content-Type: application/json
           X-Sync-Secret: $env:SHOP_SYNC_SECRET
  Body: {
    discord_id: "<arg>",
    source_id:  "cli_graduate_<discord_id>_<ts>",
    badge_slug: "hyper-graduate",
    tokens_awarded: 500    // override via --tokens N
  }

Response 200:
  { badge_slug, tokens_awarded, portfolio_url, discord_role_assigned: bool, ... }

Response 409:
  { detail: "...already graduated..." }   // CLI prints "already graduated — nothing to do"
```

## Run It (manual)

```powershell
cd "H:\HyperAgent-SDK"

$env:HYPERCODE_API_URL  = "http://localhost:8000"
$env:SHOP_SYNC_SECRET   = "<your-shared-secret>"

# Default 500 tokens
node cli/index.js graduate 123456789012345678

# Custom token amount
node cli/index.js graduate 123456789012345678 --tokens 1000

# Machine-readable
node cli/index.js graduate 123456789012345678 --json
```

## Common Failures (and what to check)

| Symptom | Likely cause | Where to look |
|---|---|---|
| `✗ Graduation failed: HTTP 401` | `SHOP_SYNC_SECRET` mismatch between CLI env and V2.4 middleware | env var on both sides |
| `✗ Graduation failed: HTTP 404` | V2.4 route not registered, or wrong base URL | `HYPERCODE_API_URL`, V2.4 route table |
| `🎓 already graduated` (and you didn't expect that) | Same `discord_id` already in `user_badges` with `hyper-graduate` slug | V2.4 DB |
| `✗ Graduation failed: fetch failed / ECONNREFUSED` | V2.4 not running or wrong port | `node cli/index.js status` to see containers |
| Tokens awarded but no Discord DM | Bot service down, or user has DMs disabled, or role not configured | Discord bot container logs |
| Portfolio URL missing in response | V2.4 portfolio generator service slow/failed → it's async, may arrive on retry | Retry, then check V2.4 logs |

## Extending the Flow

Common Phase 4 follow-ups Bro will probably want:

### Add a CLI flag
1. Parse the flag in `cli/commands/graduate.js` `run(args)` (look for `args.includes('--<flag>')` pattern)
2. Pass into the body or headers
3. Mirror the new field in the V2.4 route handler (use `cross-repo-sync` skill)
4. Bump SDK MINOR version (it's an additive feature)

### Add a new badge slug option
- Default is `hyper-graduate`. To allow customization:
  - Add `--badge <slug>` flag to the CLI
  - V2.4 must accept the slug + verify the user is eligible for it
  - Update DB seed with the new badge

### Auto-graduate hook from Course
- Course final-assessment endpoint can call V2.4 directly (server-to-server) using the same payload
- Use the same `X-Sync-Secret` (or a course-specific one if you split secrets)
- Set `source_id` to something like `course_final_<assessment_id>` for traceability

## Tests to Add (when extending)

The SDK doesn't currently have a `tests/graduate.test.js` — just CLI smoke tests. If you add logic worth testing:

1. Create `tests/graduate.test.js`
2. Mock `fetch` (pass via `options.fetch` if you refactor `graduate.js` to accept it)
3. Cover: 200 happy path, 409 idempotent replay, 401 secret mismatch, network timeout
4. Update `package.json` test count comment / docs from 57 → new total

## Related Skills

- `cross-repo-sync` — when changing the `/api/v1/graduate/trigger` payload shape
- `token-sync-debug` — for shared 401/secret/timeout patterns (same X-Sync-Secret pattern as awardFromCourse)
- `sdk-publish` — to ship Phase 4 changes
