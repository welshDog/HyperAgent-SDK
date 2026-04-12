Master Technical Plan v1.0
Built from actual repo content: HyperAgent-SDK + Hyper-Vibe Course MERGE_ROADMAP + SHARED_SPEC

🏗️ Architecture: Three Repos, One Ecosystem, Zero Code Merges
The entire system works as a passport-based contract — repos stay separate, manifest.json is the shared language :

text
Hyper-Vibe-Course (Supabase/Vercel)
  .agents/ + edge functions + discord-bot/
         |
         |  manifest.json (hyper-agent-spec)
         ▼
HyperAgent-SDK (npm: hyper-agent)
  validate.js + python/node templates
         |
         |  npx hyper-agent validate → npm run graduate
         ▼
HyperCode V2.4 (Docker, 26 containers)
  Hyper-Agents-Box/ ← graduated student agents
  MCP Gateway (ports 3100–3999)
  Grafana + Prometheus + Loki + Tempo
📍 Implementation Roadmap (6 Phases)
Phase 0 — Hard Conflict Fixes ⚠️ [2–3 hours] DO FIRST
Nothing else works until these are done :

Course docker-compose.yml → remove port 5432 binding + remove apps/web service

Course discord-bot/cogs/xp.py → rename /leaderboard → /xp-leaderboard

V2.4 Alembic migration → ADD discord_id VARCHAR(30) UNIQUE NULLABLE to users table

Phase 1 — Identity Bridge [1–2 days]
Goal: both systems can look up the same human by Discord ID :

Course: new course-profile edge fn → { user_id, discord_id, broski_tokens, tier }

V2.4: GET /api/v1/users/by-discord/{id} + POST /api/v1/users/link-course

V2.4: new cogs/hypercode_sync.py → /coursestats Discord command

✅ Verify: /coursestats shows BOTH Course + V2.4 stats in one embed

Phase 2 — Token Sync [1 day]
One-way: Course → V2.4, <30 seconds, idempotent :

Course webhook on token_transactions INSERT → fires sync-tokens-to-v24

V2.4 POST /api/v1/economy/award-from-course → deduped via source_id key

New table: course_sync_events stores source_id to block double-counting

Phase 3 — Agent Access + Shop Bridge [1–2 days]
Buy item in Course → get real V2.4 sandbox access :

Course: migration 000021 (JSONB metadata on shop_items), seed "Agent Sandbox Access" (300 tokens)

V2.4: POST /api/v1/access/provision → returns { api_key, mission_control_url }

✅ Verify: buy item → Discord DM → curl /health returns 200

Phase 4 — npm run graduate 🔥 [2–3 days]
The flagship feature — one command turns a Course student into a V2.4 developer :

text
scripts/graduate.js — 8 steps:
  1. npx hyper-agent validate .agents/
  2. Fetch student identity via course-profile
  3. generate-v2-config → build docker-compose.agents.yml
  4. Scaffold v2-deployment/ from Handlebars templates
  5. Write runtime-specific Dockerfiles (python/node/deno)
  6. Create GitHub PR
  7. award-graduate-badge → Level 4 upgrade in V2.4
  8. V2.4 bot sends Discord DM with Mission Control URL
Phase 5 — Observability [4–6 hours]
V2.4 Grafana shows Course activity live :

Course: course-metrics-relay edge fn (triggers: lesson, token, shop)

V2.4: new Prometheus scrape job + Grafana "Course Integration" dashboard

✅ Verify: complete lesson → Grafana updates within 15 seconds

Phase 6 — Terminal Tools Integration 🆕 [1 day]
Based on the Starship/fzf/Claude Code analysis:

claude-code-agent wrapper deployed to V2.4, port 3201 (code-review range per spec)

config/starship.toml in Course repo with BROski$ balance module

docs/terminal-setup.md covering fzf + PSFzf guide for Hyper devs

🗂️ Code Map: Every Module & Relationship
HyperAgent-SDK (the passport issuer):

hyper-agent-spec.json — source of truth schema

cli/validate.js — ajv-based, coloured pass/fail output

templates/python-starter/ + node-starter/ — Level 1 starting points

package.json — bin: hyper-agent → cli/validate.js

Course — 5 new Edge Functions, 8 new scripts/lib/ modules, 2 migrations :

supabase/functions/: course-profile, sync-tokens-to-v24, generate-v2-config, award-graduate-badge, course-metrics-relay

scripts/lib/: validate-agents, fetch-identity, generate-config, scaffold-deployment, write-dockerfiles, create-pr, award-badge, send-dm

V2.4 — 5 new endpoints, 2 new models, 2 Alembic migrations, 1 new cog :

backend/app/api/v1/: users.py (updated), economy.py (new), access.py (new)

alembic/versions/: add_discord_id (Phase 0 critical!), add_course_sync (Phase 2)

discord-bot/cogs/hypercode_sync.py — /coursestats command

🗄️ Database Schema (Key Tables)
Table	Repo	Key Fields	Phase
users	V2.4	discord_id VARCHAR(30) UNIQUE	Ph0 — CRITICAL
course_sync_events	V2.4	source_id TEXT UNIQUE (dedup key)	Ph2
shop_items	Course	metadata JSONB	Ph3
shop_purchases	Course	metadata JSONB (stores api_key)	Ph3
The dedup logic is elegant: token_transactions.source_id in Course equals course_sync_events.source_id in V2.4 — same key, zero double-counting on webhook retries .

🔌 API Endpoints (5 V2.4 + 5 Edge Functions)
All V2.4 endpoints use Bearer token auth. All failures return { error, detail } JSON:

text
GET  /api/v1/users/by-discord/{discord_id}    → { id, coins, agent_access_level }
POST /api/v1/users/link-course                → { linked: true, v24_user_id }
POST /api/v1/economy/award-from-course        → { ok: true, new_balance }  [idempotent]
POST /api/v1/access/provision                 → { api_key, mission_control_url }
POST /api/v1/access/graduate                  → { upgraded_to: 4, dm_sent: true }
🧪 Testing Strategy
Scope	Tool	Coverage Target
SDK CLI	validate.test.js	90%+
V2.4 new APIs	pytest	85%+
Course edge fns	Deno test runner	80%+
Graduate script	Jest (mock ext. calls)	75%+
Critical test: test_award_from_course_idempotent — same source_id twice must return 409, not double the coins .

🚀 Deployment Order (Matters!)
Each phase has a strict deploy order to avoid breaking dependencies :

V2.4 Alembic migration FIRST (Phase 0) — everything in Phases 1–4 depends on discord_id column existing

V2.4 endpoints → Course edge fns → Discord cog (always V2.4 first, Course second)

npm publish hyper-agent → Course scripts/ → E2E graduate test

📊 Performance & Security Benchmarks
Metric	Target	Status
API response	<100ms	✅ Validated
Token sync latency	<30 seconds	🎯 Phase 2 target
Graduate script runtime	<60 seconds	🎯 Phase 4 target
Memory usage	<50% (2.4GB)	✅ Currently 33%
Uptime	>99.9%	✅ Currently 99.95%
New code coverage	85–90%	🎯 Spec target
Security non-negotiables: Semgrep + Trivy on every push, source_id dedup preventing economic exploits, agent_access_level only upgradeable via the approved award-graduate-badge flow — no shortcuts .

🚫 What NEVER Gets Merged
These boundaries are permanent :

Supabase schema ↔ V2.4 Postgres (incompatible tooling + trust models)

.env files, CLAUDE.md files, Discord bot tokens (stay separate forever)

apps/web/ — archived, not migrated

V2.4 docker-compose into Course (Course deploys to Vercel, zero containers)

Total timeline: ~2 weeks focused dev across all 3 repos. The critical path is crystal clear: Phase 0 → Phase 1 (the discord_id Alembic migration unlocks everything) → Phase 3 → Phase 4. Want me to start writing the actual code for Phase 0 right now — that Alembic migration is 20 lines and unblocks the entire project? 🦅