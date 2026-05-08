---
name: token-sync-debug
description: Triage failures in the Phase 3 awardFromCourse() helper — 401 secret mismatches, 409 idempotent replays, timeouts, network errors, BROWSER_FORBIDDEN, MISSING_SECRET, validation rejections. Use when the user says "awardFromCourse failing", "401 from V2.4", "token sync broken", "course not awarding tokens", "duplicate replay", or hits any AwardFromCourseError.
---

# token-sync-debug

Decision tree for `awardFromCourse()` failures. The helper lives in `cli/client.js`. All errors are `AwardFromCourseError` with a stable `code` field — branch on the code first.

## Step 0 — Identify the Error Code

```javascript
try {
  await awardFromCourse({ sourceId, discordId, tokens });
} catch (e) {
  console.log(e.code, e.status, e.message);
}
```

| `code` | What it means | Section |
|---|---|---|
| `BROWSER_FORBIDDEN` | Called from a browser/client bundle | §1 |
| `MISSING_SECRET` | `COURSE_SYNC_SECRET` not set | §2 |
| `INVALID_SOURCE_ID` / `INVALID_DISCORD_ID` / `INVALID_TOKENS` / `INVALID_REASON` | Validation rejection | §3 |
| `NO_FETCH` | Node < 18 or `globalThis.fetch` missing | §4 |
| `TIMEOUT` | Request exceeded `timeoutMs` (default 5000) | §5 |
| `NETWORK` | Fetch threw before getting a response | §6 |
| `BAD_STATUS` (with `status: 401`) | Secret mismatch / unauthorized | §7 |
| `BAD_STATUS` (with `status: 4xx/5xx`) | Other server error | §8 |
| Returns `{ duplicate: true }` (NOT an error) | 409 idempotent replay — expected | §9 |

## §1 — `BROWSER_FORBIDDEN`

The helper checks `typeof window !== 'undefined'`. You're importing it from a client component.

**Fix:**
- Move the call to a Next.js route handler / API route / server action / Supabase Edge Function / Vercel function
- NEVER import `@w3lshdog/hyper-agent/client` from `'use client'` files
- The secret would leak to the browser bundle — this guard is by design

## §2 — `MISSING_SECRET`

`COURSE_SYNC_SECRET` env var not set, OR not passed via `options.secret`.

**Fix:**
```powershell
# Local dev
$env:COURSE_SYNC_SECRET = "<value matching V2.4's expected secret>"

# Vercel (Course repo deploy)
# → Project Settings → Environment Variables → COURSE_SYNC_SECRET
# Re-deploy after setting

# Supabase Edge Functions
supabase secrets set COURSE_SYNC_SECRET=<value>
```

The V2.4 server ALSO needs the same value in its `X-Sync-Secret` middleware. They must match exactly.

## §3 — Validation Errors

Code tells you exactly which field. Limits:

| Field | Constraint |
|---|---|
| `sourceId` | non-empty string, ≤128 chars |
| `discordId` | non-empty string, ≤32 chars |
| `tokens` | integer, 1..10000 |
| `reason` | optional string, ≤255 chars |

**Common gotchas:**
- `tokens: "50"` (string) → `INVALID_TOKENS`. Must be a number, must be integer.
- Discord snowflakes are usually 18 digits → fits in 32 char limit.
- `sourceId` should be your DB primary key or txn id — DON'T regenerate per retry (breaks idempotency).

## §4 — `NO_FETCH`

Node < 18, or running in a runtime without global `fetch`.

**Fix:**
- Upgrade Node to 18+ (we declare `engines.node >= 18.0.0` in package.json)
- Or pass a fetch impl: `awardFromCourse(input, { fetch: customFetch })`

## §5 — `TIMEOUT`

Default 5000 ms. The request was aborted via `AbortController`.

**Diagnose:**
1. Is V2.4 actually up?
   ```powershell
   curl http://localhost:8000/health
   # or
   node H:\HyperAgent-SDK\cli\index.js status
   ```
2. Is the network slow? Bump the timeout:
   ```javascript
   awardFromCourse(input, { timeoutMs: 15000 })
   ```
3. Is the V2.4 endpoint deadlocked? Check V2.4 logs for the `/api/v1/economy/award-from-course` route.

## §6 — `NETWORK`

`fetch` threw before getting a response (DNS, connection refused, TLS handshake fail).

**Diagnose:**
- Wrong `baseUrl`? Check `process.env.HYPERCODE_API_URL` — defaults to `http://localhost:8000`
- V2.4 not running locally → start the Docker stack
- Production: cert issue, network egress block, wrong URL in env var
- The original error is in `e.cause` — read it for the real message

## §7 — `BAD_STATUS` with `status: 401`

The most common production failure. V2.4 rejected the `X-Sync-Secret` header.

**Checklist:**
1. Is `COURSE_SYNC_SECRET` set in the calling env? (§2)
2. Does it match V2.4's expected value EXACTLY? Whitespace, trailing newline, base64 padding all matter.
3. Did V2.4's secret recently rotate? Re-pull from the source of truth.
4. Is the header reaching V2.4 unmodified? Check any proxy / CDN that might strip custom headers.
5. Are you hitting the right environment? Local secret won't work against staging.

**Verify the secret round-trip:**
```powershell
$secret = $env:COURSE_SYNC_SECRET
curl -X POST "$env:HYPERCODE_API_URL/api/v1/economy/award-from-course" `
  -H "Content-Type: application/json" `
  -H "X-Sync-Secret: $secret" `
  -d '{"source_id":"debug_test","discord_id":"123456789012345678","tokens":1,"reason":"debug"}'
# 401 → secret wrong
# 200/409 → secret right (and you may have just awarded a token in debug; clean up if not desired)
```

## §8 — `BAD_STATUS` with other codes

| Status | Meaning | Action |
|---|---|---|
| 400 | V2.4 rejected the body shape | Cross-check payload against V2.4's Pydantic model — likely a schema drift, use `cross-repo-sync` skill |
| 404 | Endpoint not found | Check `baseUrl` + V2.4 route registration |
| 422 | FastAPI validation error | `e.message` has details — check field names/types |
| 429 | Rate limited | Backoff + retry |
| 500 | V2.4 crashed | Check V2.4 logs (`node cli/index.js logs --tail 50`) |
| 502/503/504 | Gateway/upstream issue | Likely V2.4 down or restarting |

## §9 — `{ duplicate: true }` on 409

**This is NOT an error — it's expected behavior.** Means the same `sourceId` was already processed. Replay-safe.

If you see it unexpectedly:
- You're regenerating `sourceId` per call (don't — use the DB row id)
- A previous attempt actually succeeded but you didn't record the result; treat 409 as success
- Two parallel jobs are racing on the same source row → one will win, the other gets 409, both are correct

## Mock V2.4 Server (for local debugging)

The test suite already has one — `tests/client.test.js` spins up a local mock. To run it standalone for ad-hoc testing:

```javascript
// debug-server.js
const http = require('http');
http.createServer((req, res) => {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    console.log('headers:', req.headers);
    console.log('body:', body);
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ awarded: 1, coins_balance: 100, xp_balance: 50, level: 1 }));
  });
}).listen(8000, () => console.log('mock V2.4 on :8000'));
```

```powershell
node debug-server.js
# in another shell:
$env:HYPERCODE_API_URL = "http://localhost:8000"
$env:COURSE_SYNC_SECRET = "anything"  # mock doesn't check
node -e "require('H:/HyperAgent-SDK/cli/client').awardFromCourse({sourceId:'t1',discordId:'1234',tokens:1}).then(console.log)"
```

## When None Of The Above Works

1. Run the existing test suite to confirm the helper itself is healthy:
   ```powershell
   cd "H:\HyperAgent-SDK"
   node --test tests/client.test.js
   # → expect 14 tests pass
   ```
2. If tests pass, the helper is fine — the issue is environmental (V2.4, secret, network).
3. If tests fail, the helper itself is broken — read `cli/client.js`, fix, ship via `sdk-publish` skill.

## Related Skills
- `phase-4-graduation` — same `X-Sync-Secret` pattern, similar 401/timeout debug applies
- `cross-repo-sync` — when payload shape drift caused the 400/422
