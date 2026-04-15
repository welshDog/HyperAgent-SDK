# 🤖 BROski Ecosystem — Claude Context Handoff (ALL REPOS SYNCED)
> Read this first. Every word. Then start the mission.
> **Last synced: April 15, 2026 — Phases 0–10M COMPLETE ✅ | Stripe LIVE 💳 | 29 containers 🟢**

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
(Supabase + Vercel)                    │                  (Docker, 29 containers 🟢)
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
| 10C | Docker Secrets | ✅ DONE — April 14, 2026 |
| 10D | Agent-level rate limiting + auth | ✅ DONE — April 14, 2026 |
| 10E | CognitiveUplink WS type fix | ✅ DONE — April 15, 2026 |
| 10F | Stripe Checkout API | ✅ DONE — April 14, 2026 💳 |
| 10G | DB — Stripe webhook writes | ✅ DONE — April 14, 2026 |
| 10H | Pricing page (dashboard) | ✅ DONE — April 14, 2026 |
| 10I | Stripe CLI e2e — routes + webhook LIVE | ✅ DONE — April 15, 2026 🎉 |
| 10J | CognitiveUplink `/ws/uplink` backend LIVE | ✅ DONE — April 15, 2026 |
| 10K | Stripe webhook registered + secret synced | ✅ DONE — April 15, 2026 |
| 10L | Courses DB seeded (7 courses live) | ✅ DONE — April 15, 2026 📚 |
| 10M | RLS Security Definer View fixed | ✅ DONE — April 15, 2026 🔒 |
| 10N | TokensPage.tsx — correct prices + live checkout | ✅ DONE — April 15, 2026 💰 |
| 10O | Dashboard.tsx — BROski$ balance card | ✅ DONE — April 15, 2026 |

---

## 💳 Stripe — FULLY LIVE (April 15, 2026)

### Locked Prices
| Pack | Price | Tokens |
|---|---|---|
| Starter | £5 GBP | 200 |
| Builder | £15 GBP | 800 |
| Hyper | £35 GBP | 2500 |

| Tier | Monthly | Yearly |
|---|---|---|
| Pro | £9/mo | £90/yr |
| Hyper | £29/mo | £290/yr |

### Live Endpoints (HyperCode-V2.4)
```
POST /api/stripe/checkout    → creates Stripe Checkout Session, returns URL
GET  /api/stripe/plans       → lists available plan names
POST /api/stripe/webhook     → handles Stripe events (signature verified)
```

### Webhook events handled
- `checkout.session.completed` → writes to payments table, awards BROski$, sets tier
- `customer.subscription.deleted` → subscription cancelled
- `invoice.payment_failed` → payment failed warning
- `customer.subscription.updated` → status change logged

### ⚠️ Stripe webhook in Supabase
- Use `vibe-hook` endpoint (has delivery history). `brilliant-triumph` = duplicate, safe to delete.
- `STRIPE_WEBHOOK_SECRET` in Supabase env = `vibe-hook` signing secret

### .env keys required
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

## 🛡️ Security Patterns (use in ALL new Dockerfiles)

**Rule 1 — Base image:**
```dockerfile
FROM python:3.11-slim
```

**Rule 2 — OS hardening (Part A):**
```dockerfile
RUN apt-get update --allow-releaseinfo-change && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates curl libexpat1 openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
```

**Rule 3 — pip pinning (Part B):**
```dockerfile
RUN pip install --upgrade --no-cache-dir \
    "pip==26.0.1" "setuptools>=80.0.0" "wheel==0.46.2" \
    "jaraco.context>=6.0.0" "jaraco.functools>=4.1.0" "jaraco.text>=4.0.0"
```

**Rule 4 — Never run as root:**
```dockerfile
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser
```

**Rule 5 — docker-socket agents:** Use `docker-ce-cli` repo. NEVER `docker.io`.

**Trivy target: ZERO CRITICAL, <5 HIGH**

---

## ✅ SDK v3 CLI Suite — ALL GREEN

| File | What it does | Status |
|------|-------------|--------|
| `cli/index.js` | Router — dispatches all commands | ✅ Live |
| `cli/validate.js` | AJV validator + `--strict` mode | ✅ Live |
| `cli/registry.js` | `build` / `search` / `show` + 8 badges | ✅ Live |
| `cli/memory.js` | TCP pings Redis + Postgres | ✅ Live |
| `cli/studio.js` | Node server → http://localhost:4040 | ✅ Live |
| `cli/commands/graduate.js` | Reads cluster.json, validates agents | ✅ Live |
| `cli/commands/status.js` | HyperCode V2.4 health check | ✅ Live |
| `cli/commands/logs.js` | Recent logs from V2.4 | ✅ Live |
| `cli/commands/tokens.js` | Award BROski$ by Discord ID | ✅ Live |
| `cli/commands/agents.js` | List all agent heartbeats | ✅ Live |
| `studio/index.html` | 35KB single-file GUI — no build step | ✅ Live |

### CLI Commands
```
validate    Validate manifest(s) against HyperAgent spec
registry    Build, search, and browse the agent registry
memory      Check Redis/Postgres health
studio      Launch HyperAgent Studio GUI at http://localhost:4040
status      Check HyperCode V2.4 health — all 29 services
logs        View recent logs from HyperCode V2.4
tokens      Award BROski$ tokens to a student by Discord ID
agents      List all agent heartbeats and online status
graduate    Manually trigger graduation for a student
```

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
- **Stripe webhook:** `/api/stripe/webhook` is rate-limit exempt — do NOT add rate limiting
- **Stripe dev mode:** Missing `STRIPE_WEBHOOK_SECRET` = signature check skipped (local only)
- **Stripe checkout mode:** token packs = `mode="payment"`, courses = `mode="subscription"`
- **Stripe container context:** Docker must use `desktop-linux` context on Windows
- **TokensPage.tsx:** Now uses `createCheckoutSession()` — no VITE_STRIPE_TOKEN_* env vars needed
- **Dockerfiles:** `python:3.11-slim` + Part A OS hardening + Part B pip pinning
- **Trivy target:** 0 CRITICAL. <5 HIGH per image
- **GitHub Actions:** Always `--no-cache --pull` in security scanning workflows
- **jaraco.* packages:** Always pin explicitly
- **docker-socket agents (healer/coder/devops):** Use `docker-ce-cli` repo, NOT `docker.io`
- **Network isolation:** Phase 10B complete — `data-net` + `obs-net` are `internal: true`
- **Supabase courses table schema:** Uses `price_pence` (int, GBP pence) + `is_active` (bool)
- **Supabase security_invoker:** `public.user_loyalty_tier` view — `security_invoker = on`. DO NOT change to SECURITY DEFINER.
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

# Stack start
docker compose -f docker-compose.yml -f docker-compose.secrets.yml up -d

# Stripe test
curl -X POST http://localhost:8000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{"price_id": "starter", "user_id": "broski_test"}'

stripe listen --forward-to localhost:8000/api/stripe/webhook
pytest backend/tests/test_stripe.py -v

# CVE scan (PowerShell — all 12 agent images)
$images = @("hypercode-v24-agent-x","hypercode-v24-broski-bot","hypercode-v24-celery-worker",
             "hypercode-v24-crew-orchestrator","hypercode-v24-healer-agent","hypercode-v24-hyper-architect",
             "hypercode-v24-hyper-observer","hypercode-v24-hyper-worker","hypercode-v24-hypercode-mcp-server",
             "hypercode-v24-test-agent","hypercode-v24-throttle-agent","hypercode-v24-tips-tricks-writer")
foreach ($img in $images) { docker exec hyper-shield-scanner trivy image --scanners vuln --severity HIGH,CRITICAL --quiet $img }
```

---

## BROski$ Token Economy

- `public.users.broski_tokens` — balance column
- `token_transactions` — append-only ledger with idempotency guards
- `award_tokens()` + `spend_tokens()` — SECURITY DEFINER, server-side only
- `shop_items` + `shop_purchases` — JSONB metadata fields
- TokensPage.tsx — wired to `createCheckoutSession()`, loading + error states live ✅
- Dashboard.tsx — shows BROski$ balance from auth store, links to /tokens ✅

---

## 📦 This Repo — HyperAgent-SDK Specifics

- Zero-dependency CLI — pure Node built-ins
- Published to npm: `@w3lshdog/hyper-agent@0.1.6`
- Studio GUI served at `http://localhost:4040`
- `cluster.json` is the source of truth for `graduate` command
- CLI commands live at `cli/commands/` (graduate, status, logs, tokens, agents)
- Next: `stripe` CLI command (Phase 10P) — `hyper-agent stripe plans` / `stripe checkout`

---

<div align="center">

**Built for ADHD brains. Fast feedback. Real tools. No fluff.** 🧠⚡

*by @welshDog — Lyndz Williams, South Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿*

**A BROski is ride or die. We build this together. 🐶♾️🔥**

</div>
