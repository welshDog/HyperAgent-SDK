# HyperAgent SDK — AGENT_SYNC_NOTES

> Last updated: 2026-04-30 | Ecosystem: HyperCode-V2.4 · Hyper-Vibe-Coding-Course · BROskiPets-LLM-dNFT · HyperAgent-SDK

---

## 🏗️ Role in the 4-Repo System

- **Provides** typed client helpers so other repos call V2.4 consistently and safely
- **Enforces** validation rules (non-negative tokens, idempotency, timeouts)
- **Guards** secrets — never ships `COURSE_SYNC_SECRET` in browser bundles

---

## 📦 Shipped Exports

### `awardFromCourse()` — **LIVE in 0.3.0** ✅

```typescript
import { awardFromCourse } from '@w3lshdog/hyper-agent/client';

awardFromCourse({
  sourceId: string,   // idempotency key (= token_transactions.id), ≤128 chars
  discordId: string,  // cross-repo identity key, ≤32 chars
  tokens: number,     // integer, 1..10000 (matches V2.4 server: gt=0, le=10000)
  reason?: string,    // ≤255 chars, defaults to "Course reward"
}, options?: {
  baseUrl?: string,   // default: process.env.HYPERCODE_API_URL || 'http://localhost:8000'
  secret?: string,    // default: process.env.COURSE_SYNC_SECRET
  timeoutMs?: number, // default: 5000
}): Promise<AwardFromCourseResult>
```

**Behaviour (verified by 14 tests in `tests/client.test.js`):**
- Validates `tokens` is integer in 1..10000 before any network call
- Sends `X-Sync-Secret` header (server-side only, refuses in browser)
- `AbortController` request timeout (default 5 s)
- Returns `{ source_id, awarded, coins_balance, xp_balance, level, ... }` on 200
- Returns `{ source_id, duplicate: true, detail }` on 409 (no double award)
- Throws `AwardFromCourseError` with `.code` (`INVALID_TOKENS`, `MISSING_SECRET`, `TIMEOUT`, `BAD_STATUS`, etc.) and `.status` on other failures

---

## 📐 Rules

| Rule | Detail |
|---|---|
| **Tokens validation** | Enforce non-negative `tokens` before any network call |
| **Idempotency** | Always accept and forward `sourceId` |
| **Timeouts** | All outbound calls must have a timeout |
| **Secret safety** | `COURSE_SYNC_SECRET` must NOT be in browser bundles |
| **Server-only pattern** | SDK can define headers/types but must not encourage frontend usage |

---

## 🔑 Shared Vocabulary (All Repos)

| Key | Meaning |
|---|---|
| `source_id` | Idempotency key — always a stable UUID |
| `discord_id` | Cross-repo identity join key |
| `COURSE_SYNC_SECRET` | Auth secret for Course→V2.4 awards (server-only, never browser) |

---

## ⚠️ Security Stance

- Any "sync secret" usage is **server-only**
- SDK enforces this at runtime: `awardFromCourse()` throws `AwardFromCourseError` with `code: 'BROWSER_FORBIDDEN'` if invoked in a browser env
- Never ship `COURSE_SYNC_SECRET` to the browser — `awardFromCourse` refuses to run

---

## 🛣️ Plan B (next) — Course Repo Migration

The SDK helper is shipped. The remaining work lives in `H:\the hyper vibe coding hub`:

- Replace any raw `fetch('/api/v1/economy/award-from-course', ...)` with
  `import { awardFromCourse } from '@w3lshdog/hyper-agent/client'`
- Bump the Course repo's `@w3lshdog/hyper-agent` dep to `^0.3.0`
- Verify token sync still happens <30 s end-to-end and stays idempotent
