# 🤖 BROski Ecosystem — Claude Context Handoff (ALL REPOS SYNCED)
> Read this first. Every word. Then start the mission.
> **Last synced: April 14, 2026 — Phases 0–10F COMPLETE ✅ | Stripe Checkout API LIVE 💳**

---

## Who You're Talking To
- **Lyndz** aka BROski♾️ (GitHub: @welshDog, npm: @w3lshdog) — South Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿
- Autistic + dyslexic + ADHD — chunked output, quick wins first, no waffle
- Windows primary (PowerShell), WSL2 + Raspberry Pi + Docker secondary
- Call them **"Bro"** — that's how we roll
- Short sentences. Emojis. Bold the key stuff. Celebrate wins! 🎉

---

## The Ecosystem

```
Hyper-Vibe-Coding-Course     ──── manifest.json ────▶    HyperCode V2.4
github.com/welshDog/             (hyper-agent-spec)       github.com/welshDog/
Hyper-Vibe-Coding-Course                                  HyperCode-V2.4
(Supabase + Vercel)                    │                  (Docker, 29 containers)
Path: H:\the hyper vibe coding hub     │                  Path: H:\HyperStation zone\
                                       │                       HyperCode\HyperCode-V2.4
                              HyperAgent-SDK
                          github.com/welshDog/HyperAgent-SDK
                          npm: @w3lshdog/hyper-agent@0.1.6
                          Path: H:\HyperAgent-SDK
```

---

## 🏆 Full Phase Roadmap

| Phase | Name | Status |
|---|---|---|
| 0 | Hard Conflict Fixes | ✅ DONE |
| 1 | Identity Bridge | ✅ DONE + VERIFIED LIVE |
| 2 | Token Sync | ✅ DONE + VERIFIED LIVE |
| 3 | Agent Access + Shop Bridge | ✅ DONE + VERIFIED LIVE |
| 4 | npm run graduate 🔥 | ✅ DONE + VERIFIED LIVE |
| 5 | Observability | ✅ DONE + VERIFIED LIVE |
| 6 | Terminal Tools Integration | ✅ DONE + VERIFIED LIVE |
| 7 | Dockerfile Security Hardening | ✅ DONE — April 14, 2026 |
| 8 | CI/CD Trivy Security Pipeline | ✅ DONE — April 14, 2026 |
| 9 | CVE Elimination (apt + pip pinning) | ✅ DONE — April 14, 2026 |
| 10A | FastAPI / Starlette upgrade | ✅ DONE |
| 10B | Docker Compose Network Isolation | ✅ DONE — April 14, 2026 |
| 10F | **Stripe Checkout API** | ✅ DONE — April 14, 2026 💳 |

---

## 💳 Phase 10F — Stripe Checkout API (LIVE — April 14, 2026)

### What was built (in HyperCode-V2.4)
- `backend/app/routes/stripe.py` — 3 FastAPI endpoints
- `backend/app/services/stripe_service.py` — all Stripe logic + price map
- `backend/tests/test_stripe.py` — 4 tests (pytest)
- `backend/app/main.py` — Stripe router registered, `/api/stripe/webhook` rate-limit exempt

### Live Endpoints
```
POST /api/stripe/checkout    → creates Stripe Checkout Session, returns URL
GET  /api/stripe/plans       → lists available plan names
POST /api/stripe/webhook     → handles Stripe events (signature verified)
```

### Webhook events handled
- `checkout.session.completed` → subscription activated (TODO 10G: write to DB)
- `customer.subscription.deleted` → subscription cancelled (TODO 10G: downgrade in DB)
- `invoice.payment_failed` → payment failed warning (TODO 10G: notify user)
- `customer.subscription.updated` → status change logged

---

## 🎯 NEXT UP — Phase 10G+

| Phase | Task | Why |
|---|---|---|
| **10G** | DB — save subscription to Postgres on webhook | Hook `checkout.session.completed` → update users table |
| **10H** | Frontend — Pricing page + checkout button | Next.js UI wired to `/api/stripe/checkout` |
| **10I** | Stripe CLI end-to-end local testing | `stripe listen --forward-to localhost:8000/api/stripe/webhook` |
| **10C** | Secrets management (Docker secrets / Vault) | `.env` files still used locally — productionise |
| **10D** | Agent-level rate limiting + auth | Per-agent API keys for internal network |
| **10E** | Open bug: CognitiveUplink.tsx ~130 | WS message type `"command"` → `"execute"` |

---

## 🔒 Stripe Prices — LOCKED (April 14, 2026)

### BROski Token Packs (one-time)
| Pack | Price | Tokens | Stripe Product Name |
|---|---|---|---|
| Starter | £5 GBP | 200 | BROski Starter Pack |
| Builder | £15 GBP | 800 | BROski Builder Pack |
| Hyper | £35 GBP | 2500 | BROski Hyper Pack |

### Course Subscriptions (recurring)
| Tier | Monthly | Yearly | Stripe Product Name |
|---|---|---|---|
| Pro | £9/mo | £90/yr | Hyper Vibe Pro Course |
| Hyper | £29/mo | £290/yr | Hyper Elite |

### Digital Shop Items (paid in BROski$)
- Prompt Packs: 200 BROski$
- Templates: 150 BROski$
- Bonus Lessons: 100 BROski$

### .env keys to add
```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_BUILDER=price_xxx
STRIPE_PRICE_HYPER=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_HYPER_MONTHLY=price_xxx
STRIPE_PRICE_HYPER_YEARLY=price_xxx
```

---

## 🌐 Phase 10B — Docker Network Topology (LIVE)

- `frontend-net` (bridge, internet) — dashboard, mission-ui, mcp-server
- `backend-net` (bridge, internet) — hypercode-core (bridges all layers)
- `agents-net` (bridge, internet) — all AI agents, LLM API calls
- `data-net` (bridge, **internal: true**) — redis + postgres + minio + chroma
- `obs-net` (bridge, **internal: true**) — prometheus, grafana, loki, tempo, promtail

---

## 🛡️ Phase 9 Security Patterns (use in ALL new Dockerfiles)

**Part A — OS hardening:**
```dockerfile
RUN apt-get update --allow-releaseinfo-change && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates curl libexpat1 openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
```

**Part B — pip pinning:**
```dockerfile
RUN pip install --upgrade --no-cache-dir \
    "pip==26.0.1" "setuptools>=80.0.0" "wheel==0.46.2" \
    "jaraco.context>=6.0.0" "jaraco.functools>=4.1.0" "jaraco.text>=4.0.0"
```

---

## ✅ SDK v3 CLI Suite — ALL GREEN

| File | What it does | Status |
|------|-------------|--------|
| `cli/index.js` | Router — dispatches all subcommands | ✅ Live |
| `cli/validate.js` | AJV validator + `--strict` mode | ✅ Live |
| `cli/registry.js` | `build` / `search` / `show` + 8 auto-computed badges | ✅ Live |
| `cli/memory.js` | TCP pings Redis + Postgres, health output | ✅ Live |
| `cli/studio.js` | Zero-dependency Node server on port 4040 | ✅ Live |
| `cli/commands/status.js` | HyperCode V2.4 health — all services | ✅ Live |
| `cli/commands/logs.js` | Recent logs from HyperCode V2.4 | ✅ Live |
| `cli/commands/tokens.js` | Award BROski$ tokens by Discord ID | ✅ Live |
| `cli/commands/agents.js` | List agent heartbeats + online status | ✅ Live |
| `cli/commands/graduate.js` | Manually trigger graduation for a student | ✅ Live |
| `studio/index.html` | 35KB single-file GUI — no build step | ✅ Live |

---

## ✅ Full History (condensed)

### Phase 0 ✅ — Port conflicts, xp-leaderboard, Alembic migration
### Phase 1 ✅ — discord_id bridge, /coursestats Discord command, Edge Function fan-out
### Phase 2 ✅ — Token sync, CourseSyncEvent ORM, /award-from-course, dedup guards
### Phase 3 ✅ — AccessProvision, /provision, shop trigger → Discord DM with api_key
### Phase 4 ✅ — GraduationEvent ORM, /graduate/trigger, Edge Function, Discord Graduate role
### Phase 5 ✅ — Structured JSON logging, MetricsMiddleware, /health + /metrics, Grafana
### Phase 6 ✅ — 5 CLI commands verified. Logs routing fix
### Phase 7 ✅ — 19 Dockerfiles: non-root users, multi-stage rewrites
### Phase 8 ✅ — trivy-scan.yml, trivy-weekly.yml, Makefile scan targets
### Phase 9 ✅ — CVE result: agent-x 11 CRITICAL → 0 CRITICAL, 55 HIGH → 14 HIGH
### Phase 10A ✅ — FastAPI upgraded to 0.117+
### Phase 10B ✅ — Docker Compose network isolation
### Phase 10F ✅ — Stripe Checkout API: 3 endpoints + service layer + tests + main.py registered

---

## 🚨 Key Technical Rules (never re-debate these)

- **Docker imports:** `from app.X import Y` — NEVER `from backend.app.X import Y`
- **FastAPI routing:** First-match wins — public routes BEFORE auth-gated compat routes
- **Alembic down_revision:** Must match EXACT revision string
- **CLI folder:** All `hyper-agent` commands run from `H:\HyperAgent-SDK`
- **Port convention:** 3100-3199 writing, 3200-3299 code, 3300-3399 data, 3400-3499 discord, 3500-3599 automation
- **Supabase ↔ V2.4 Postgres:** NEVER merge schemas
- **`.env` files:** Never committed — use Docker secrets in production
- **One bot:** broski-bot. Old Replit bot = dead.
- **API keys:** `hc_` prefix + `secrets.token_urlsafe(32)` — 43 chars, URL-safe
- **Zero-dependency CLI:** Pure Node built-ins only
- **Stripe webhook:** `/api/stripe/webhook` is rate-limit exempt
- **Stripe dev mode:** Missing `STRIPE_WEBHOOK_SECRET` = signature check skipped (local only)
- **Dockerfiles:** `python:3.11-slim` + Part A + Part B
- **Trivy target:** 0 CRITICAL. <5 HIGH ideally
- **GitHub Actions:** Always `--no-cache --pull`
- **jaraco.* packages:** Always pin explicitly
- **docker-socket agents:** Use `docker-ce-cli` repo, NOT `docker.io`
- **Network isolation:** Phase 10B complete — `data-net` + `obs-net` are `internal: true`
- **Conventional commits:** `feat:` `fix:` `docs:` `chore:`
- **Windows PowerShell first**, bash second — always

---

## Paths (copy-paste ready)

```powershell
# HyperAgent-SDK
cd "H:\HyperAgent-SDK"

# HyperCode V2.4
cd "H:\HyperStation zone\HyperCode\HyperCode-V2.4"

# Hyper-Vibe-Coding-Course
cd "H:\the hyper vibe coding hub"

# Run Studio
hyper-agent registry build .agents/
hyper-agent studio
# → http://localhost:4040

# Validate
npx @w3lshdog/hyper-agent validate .agents/my-agent/ --strict

# Graduate cluster
hyper-agent graduate cluster.json

# Publish SDK
npm version patch --no-git-tag-version
npm publish --access public --tag alpha

# Stripe (Phase 10F)
curl -X POST http://localhost:8000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{"price_id": "starter", "user_id": "broski_test"}'

stripe listen --forward-to localhost:8000/api/stripe/webhook
pytest backend/tests/test_stripe.py -v
```

---

## BROski$ Token Economy

- `public.users.broski_tokens` — balance column
- `token_transactions` — append-only ledger with idempotency guards
- `award_tokens()` + `spend_tokens()` — SECURITY DEFINER, server-side only
- `shop_items` + `shop_purchases` — JSONB metadata fields
- Stripe integration: prices LOCKED April 14, 2026 — API LIVE Phase 10F ✅

---

## 📦 This Repo — HyperAgent-SDK Specifics

- Zero-dependency CLI — pure Node built-ins
- Published to npm: `@w3lshdog/hyper-agent@0.1.4`
- Studio GUI served at `http://localhost:4040`
- `cluster.json` is the source of truth for `graduate` command
- Next: community registry + one-click deploy to HyperCode V2.4

---

<div align="center">

**Built for ADHD brains. Fast feedback. Real tools. No fluff.** 🧠⚡

*by @welshDog — Lyndz Williams, South Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿*

**A BROski is ride or die. We build this together. 🐶♾️🔥**

</div>
