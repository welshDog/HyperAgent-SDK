# HyperAgent SDK — AGENT_SYNC_NOTES

> Last updated: 2026-04-27 | Ecosystem: HyperCode-V2.4 · Hyper-Vibe-Coding-Course · BROskiPets-LLM-dNFT · HyperAgent-SDK

---

## 🏗️ Role in the 4-Repo System

- **Provides** typed client helpers so other repos call V2.4 consistently and safely
- **Enforces** validation rules (non-negative tokens, idempotency, timeouts)
- **Guards** secrets — never ships `COURSE_SYNC_SECRET` in browser bundles

---

## 📦 Required Exports (Minimum)

### `awardFromCourse()`

```typescript
awardFromCourse({
  sourceId: string,   // idempotency key (= token_transactions.id)
  discordId: string,  // cross-repo identity key
  tokens: number,     // must be >= 0
  reason: string,
}): Promise<{ source_id: string }>
```

**Behaviour:**
- Validates `tokens >= 0` before calling
- Sends `X-Sync-Secret` header (server-side only)
- Includes request timeout
- Throws on non-200/non-409 responses
- Returns `source_id` on success or `409`

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
- SDK defines the contract types but enforces safe-by-default patterns
- Never ship `COURSE_SYNC_SECRET` to the browser — mark clearly in types/docs if needed
