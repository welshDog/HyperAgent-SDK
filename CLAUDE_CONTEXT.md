# 🤖 HyperAgent-SDK + Hyperfocus Zone — Claude Context Handoff
> Read this first. Every word. Then start the mission.

---

## Who You're Talking To
- **Lyndz** aka BROski♾ (GitHub: @welshDog, npm: @w3lshdog) — South Wales
- Autistic + dyslexic + ADHD — chunked output, quick wins first, no waffle
- Windows primary (PowerShell), WSL2 + Raspberry Pi + Docker secondary
- Call them "Bro" — that's how we roll

---

## The Ecosystem

```
Hyper-Vibe-Coding-Course     ──── manifest.json ────▶    HyperCode V2.4
github.com/welshDog/             (hyper-agent-spec)       github.com/welshDog/
Hyper-Vibe-Coding-Course                                  HyperCode-V2.4
(Supabase + Vercel)                    │                  (Docker, 26 containers)
Path: H:\the hyper vibe coding hub     │                  Path: H:\HyperStation zone\
                                       │                       HyperCode\HyperCode-V2.4
                              HyperAgent-SDK
                          github.com/welshDog/HyperAgent-SDK
                          npm: @w3lshdog/hyper-agent@0.1.4
                          Path: H:\HyperAgent-SDK
```

---

## 6-Phase Roadmap — Current Status

| Phase | Name | Status |
|---|---|---|
| 0 | Hard Conflict Fixes | ✅ DONE |
| 1 | Identity Bridge | ✅ DONE + VERIFIED LIVE |
| **2** | **Token Sync** | **👈 CURRENT MISSION** |
| 3 | Agent Access + Shop Bridge | 🔜 |
| 4 | npm run graduate 🔥 | 🔜 |
| 5 | Observability | 🔜 |
| 6 | Terminal Tools Integration | 🔜 |

---

## ✅ What's Done — Full History

### HyperAgent-SDK ✅ SHIPPED
- `cli/validate.js` — AJV validator, coloured output, exit codes
- `hyper-agent-spec.json` — JSON Schema, if/then port enforcement
- `templates/python-starter/` + `templates/node-starter/` — both valid
- `npm test` — 2/2 passing ✅
- Published: `@w3lshdog/hyper-agent@0.1.4` live on npm ✅
- LICENSE (MIT) + CONTRIBUTING.md + docs/ ✅

### Phase 0 ✅ DONE
- `docker-compose.yml` — port 5432 removed, apps/web dropped
- `discord-bot/cogs/xp.py` — /leaderboard → /xp-leaderboard
- `002_add_discord_id_to_users.py` — Alembic migration created

### Phase 1 ✅ DONE + VERIFIED
Files built:
1. `backend/alembic/versions/003_add_discord_id.py` — discord_id VARCHAR(32) UNIQUE NULL
2. `backend/app/models/models.py` — discord_id added to User ORM
3. `backend/app/schemas/schemas.py` — discord_id in UserBase
4. `backend/app/api/v1/endpoints/users.py` — GET /api/v1/users/by-discord/{discord_id}
5. `supabase/functions/course-profile/index.ts` — edge fn, fans out to Supabase + V2.4
6. `agents/broski-bot/src/cogs/course_stats.py` — /coursestats Discord command
7. `bot.py` + `settings.py` — wired cog + course_profile_edge_url

**Verified:** `/coursestats` in Discord shows the dual-system embed ✅
(Shows "not linked" correctly for unlinked accounts — system working as designed)

### Bot Consolidation ✅ DONE
- Old course bot was running on **Replit** (not Docker) with a separate token
- **Action needed**: Stop Replit bot + reset its token in Discord Developer Portal
- `broski-bot` (HyperCode V2.4, Docker) is now THE ONE BOT
- Old bot had: xp.py, quests.py, badges.py, commands.py — all superseded by broski-bot's 15 cogs

---

## 🚨 IMMEDIATE TODO — Before Phase 2

These two things are not done yet:

### 1. Retire the old Replit bot
- Go to replit.com → find old course bot → **Stop** the Repl
- Go to discord.com/developers/applications → old course bot app → Bot → **Reset Token**
- Verify broski-bot still shows 🟢 online after

### 2. Link Discord account in Course portal
- Log into Hyper-Vibe-Coding-Course app → profile → connect Discord
- This writes discord_id into Supabase
- Then run /coursestats → should show actual stats instead of "not linked"
- This fully closes Phase 1 ✅

---

## 🎯 CURRENT MISSION — Phase 2: Token Sync

**Goal:** BROski$ earned in Course shows up in V2.4. One-way, <30 seconds, idempotent.

**Architecture:**
```
Course: token_transactions INSERT trigger
        ↓
Course: sync-tokens-to-v24 edge function
        ↓
V2.4: POST /api/v1/economy/award-from-course
      (deduped via source_id — zero double counting)
```

**New table needed in V2.4:**
```sql
CREATE TABLE course_sync_events (
  id SERIAL PRIMARY KEY,
  source_id TEXT UNIQUE NOT NULL,
  discord_id VARCHAR(32),
  tokens_awarded INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Files to build:**
1. V2.4 Alembic migration — `course_sync_events` table
2. V2.4 `backend/app/api/v1/endpoints/economy.py` — POST /api/v1/economy/award-from-course
3. Course `supabase/functions/sync-tokens-to-v24/index.ts` — edge function
4. Course Supabase webhook — fires on `token_transactions` INSERT

**Done when:** earn tokens in Course → V2.4 balance updates within 30 seconds ✅

**Critical:** `source_id` dedup logic must be bulletproof.
Same `source_id` twice = 409, never double the coins.

---

## Key Technical Decisions (don't re-debate these)

- Port convention: 3100-3199 writing, 3200-3299 code, 3300-3399 data, 3400-3499 discord, 3500-3599 automation
- `mcp_compatible: true` requires `port` — enforced in spec
- Supabase schema ↔ V2.4 Postgres NEVER merge — incompatible tooling
- `.env` files, Discord tokens — never committed, never merged
- `apps/web/` — archived, never migrated
- Windows PowerShell first, bash second — always
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- One bot: broski-bot. Old Replit bot = dead.

---

## Paths (copy-paste ready)

```powershell
# HyperAgent-SDK
cd "H:\HyperAgent-SDK"

# HyperCode V2.4
cd "H:\HyperStation zone\HyperCode\HyperCode-V2.4"
cd "H:\HyperStation zone\HyperCode\HyperCode-V2.4\backend"

# Hyper-Vibe-Coding-Course
cd "H:\the hyper vibe coding hub"

# V2.4 Docker commands
docker compose up -d
docker compose exec api alembic upgrade head
docker compose exec api alembic history --verbose
```

---

## npm / SDK Quick Reference

```powershell
# Validate agents
npx @w3lshdog/hyper-agent validate .agents/my-agent/
npx @w3lshdog/hyper-agent validate .agents/

# Publish new version
npm version patch --no-git-tag-version
npm publish --access public --tag alpha
```

---

## BROski$ Token Economy (Course side)

- `public.users.broski_tokens` — balance column
- `token_transactions` — append-only ledger with idempotency guards
- `award_tokens()` + `spend_tokens()` — SECURITY DEFINER, server-side only
- `shop_items` + `shop_purchases` — JSONB metadata fields
- Stripe integration for token packs (Starter/Builder/Hyper)
