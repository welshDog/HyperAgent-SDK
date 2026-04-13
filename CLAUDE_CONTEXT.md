# 🤖 HyperAgent-SDK — Claude Context Handoff
> Read this first. Every word. Then start the mission.

---

## Who You're Talking To
- **Lyndz** aka BROski♾ (GitHub: @welshDog, npm: @w3lshdog) — South Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿
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

## ✅ Full v3 State — Everything Shipped Today

### CLI Suite — ALL GREEN ✅

| File | What it does | Status |
|------|-------------|--------|
| `cli/index.js` | Router — dispatches validate / registry / memory / studio | ✅ Live |
| `cli/validate.js` | AJV validator + `--strict` mode (entrypoint, runtime sanity, env_vars, MCP port conflicts) | ✅ Live |
| `cli/registry.js` | `build` / `search` / `show` subcommands + 8 auto-computed badges | ✅ Live |
| `cli/memory.js` | TCP pings Redis (6379) + Postgres (5432), health output, docker run tips, exit code 1 if offline | ✅ Live |
| `cli/studio.js` | Zero-dependency Node server on port 4040, serves studio/index.html + /api/registry + /api/memory | ✅ Live |
| `studio/index.html` | 35KB single-file GUI — no build step, opens in 1 second | ✅ Live |

### Studio Features (already shipped)
- 🃴 Agent cards — name, version, runtime chips, badges, MCP port, memory backend
- 🔍 Live search — `/` key focuses, filters name/desc/tags/author
- 🎨 Filter sidebar — runtime, memory, badge, level L1–L5, tags (all combinable)
- 📄 Detail pane — full metadata, tool schemas, auto-generated markdown docs, copy button
- 📊 Memory footer — live Redis/Postgres dot indicators, auto-refresh every 30s
- 🧩 Cluster builder — click ⊕ or drag cards to drop zone → generates `cluster.json`
- ⬇️ One-click `cluster.json` download
- ⌨️ Keyboard: `/` to search, `Escape` to deselect

### --strict Validation Checks
| Check | Level | What it does |
|-------|-------|--------------|
| Entrypoint exists | ERROR | manifest.entrypoint file must be on disk |
| Runtime sanity | WARN | node → package.json · python → requirements.txt · deno → deno.json |
| env_vars simulation | WARN | each declared env_var checked against process.env + .env file |
| MCP port conflicts | ERROR | scans all agents in batch, flags duplicate ports |

### Auto-Computed Badges (registry build)
`⚡ MCP Ready` `🧠 Memory Enabled` `🔧 Multi-Tool` `🔐 Env Declared` `🚀 HyperCoder` `👑 Elite` `💚 Health Checked` `✅ Verified`

---

## cluster.json Format (KEY for Phase 4)

The Studio Cluster Builder exports this. `graduate.js` reads it as source of truth:

```json
{
  "cluster": "my-hyper-cluster",
  "created": "2026-04-13T10:00:00Z",
  "agents": [
    {
      "name": "code-agent",
      "manifest_path": ".agents/code-agent/manifest.json",
      "port": 3201,
      "memory": "redis"
    },
    {
      "name": "data-agent",
      "manifest_path": ".agents/data-agent/manifest.json",
      "port": 3301,
      "memory": "postgres"
    }
  ]
}
```

---

## 🎯 CURRENT MISSION — Phase 4: Graduate Script

**Goal:** One command reads `cluster.json` and graduates the whole cluster — validate all agents, check all memory backends, output deploy-ready summary. No folder scanning.

### Command
```bash
hyper-agent graduate cluster.json
hyper-agent graduate cluster.json --strict   # strict validation per agent
hyper-agent graduate cluster.json --dry-run  # validate only, don't deploy
```

### What graduate.js must do (in order)
1. ✅ Read + parse `cluster.json`
2. ✅ For each agent: load its `manifest_path` → run validate logic (reuse validate.js)
3. ✅ Run `--strict` checks if flag passed (reuse validate.js strict logic)
4. ✅ Ping memory backends (reuse memory.js TCP ping logic) — per unique backend
5. ✅ Print per-agent status table (like memory.js summary table style)
6. ✅ Print final cluster health summary
7. ✅ Exit code 1 if any agent invalid OR any memory backend offline
8. 🔜 (stretch) Output `graduate-report.json` with full results

### Output style (match existing CLI style)
```
🎓 HyperAgent Graduate v1
  Reading cluster.json...

━━━ Cluster: my-hyper-cluster (2 agents)

  Agent: code-agent
  ✅ manifest valid
  ✅ Redis ONLINE

  Agent: data-agent
  ✅ manifest valid
  ✔  Postgres OFFLINE
  💡 docker run -d --name hyper-postgres -p 5432:5432 postgres:16-alpine

📊 Cluster Summary
  ───────────────────────────────────────
  code-agent    redis     ✅ healthy
  data-agent    postgres  ✗  offline
  ───────────────────────────────────────
  ⚠️  1 agent has issues. Fix before deploying.
```

### Wire into cli/index.js
Add `graduate` to the COMMANDS object and `require('./graduate').run(args)`

### Important rules
- Zero new dependencies — pure Node built-ins only (fs, net, path)
- Reuse colour constants pattern from validate.js / memory.js
- Reuse `tcpPing()` pattern from memory.js
- Exit code 1 on any failure — CI must catch it
- Match the coloured CLI output style of existing commands

---

## Key Technical Decisions (don't re-debate these)

- Port convention: 3100-3199 writing, 3200-3299 code, 3300-3399 data, 3400-3499 discord, 3500-3599 automation
- `mcp_compatible: true` requires `port` — enforced in spec
- Supabase schema ↔ V2.4 Postgres NEVER merge — incompatible tooling
- `.env` files, Discord tokens — never committed, never merged
- Windows PowerShell first, bash second — always
- Conventional commits: `feat:` `fix:` `docs:` `chore:`
- One bot: broski-bot. Old Replit bot = dead.
- Zero-dependency CLI — pure Node built-ins only

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

# Memory check
hyper-agent memory check .agents/ --all

# Graduate (Phase 4 — to be built)
hyper-agent graduate cluster.json
```

---

## BROski$ Token Economy (for context)

- `public.users.broski_tokens` — balance column
- `token_transactions` — append-only ledger with idempotency guards
- `award_tokens()` + `spend_tokens()` — SECURITY DEFINER, server-side only
- Stripe integration for token packs (Starter/Builder/Hyper)

---

## Phase Roadmap

| Phase | Name | Status |
|-------|------|--------|
| 0 | Hard Conflict Fixes | ✅ Done |
| 1 | Identity Bridge | ✅ Done |
| 2 | Token Sync | ✅ Done |
| 3 | Studio + Memory + Registry CLI | ✅ Done TODAY 🔥 |
| **4** | **Graduate Script** | **👈 CURRENT MISSION** |
| 5 | Community Registry | 🔜 Next |
| 6 | One-click Deploy to HyperCode V2.4 | 🔜 Future |

---

<div align="center">

**Built for ADHD brains. Fast feedback. Real tools. No fluff.** 🧠⚡

*by @welshDog — Lyndz Williams, South Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿*

**A BROski is ride or die. We build this together. 🐶♾️🔥**

</div>
