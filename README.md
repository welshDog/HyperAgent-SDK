# 🤖 HyperAgent-SDK
### Write Agents Once. Deploy Anywhere.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![npm](https://img.shields.io/badge/npm-%40w3lshdog%2Fhyper--agent-red)](https://www.npmjs.com/package/@w3lshdog/hyper-agent)
[![Made by WelshDog](https://img.shields.io/badge/Made_by-WelshDog_🦅-orange)](https://github.com/welshDog)
[![Part of Hyperfocus Zone](https://img.shields.io/badge/Hyperfocus_Zone-♥️_Ecosystem-purple)](https://github.com/welshDog)
[![CLI](https://img.shields.io/badge/CLI-v3%20—%20validate%20%7C%20registry%20%7C%20studio%20%7C%20status%20%7C%20tokens%20%7C%20graduate-blue)](#)

> **"The agent toolkit behind the Hyperfocus Zone — plug in, vibe out."**

HyperAgent-SDK is the orchestration layer for AI agents across the Hyperfocus Zone ecosystem.
Build once, deploy across Discord bots, FastAPI backends, and course platforms. 🧩

**Built for ADHD brains. Fast feedback. Real tools. No fluff.** 🧠⚡

---

## ⚡ Install

```bash
# Validate an agent instantly (no install needed)
npx @w3lshdog/hyper-agent validate .agents/my-agent/

# Install as a dev dependency (for CI pipelines)
npm install -D @w3lshdog/hyper-agent
```

---

## 🚀 Quick Start — Build Your First Agent

### 1️⃣ Use a starter template
```bash
cp -r node_modules/@w3lshdog/hyper-agent/templates/python-starter .agents/my-agent
```

### 2️⃣ Define your `manifest.json`
```json
{
  "name": "my-broski-agent",
  "version": "0.1.0",
  "runtime": "python",
  "entrypoint": "main.py",
  "memory": "redis",
  "tools": [
    {
      "name": "code_gen",
      "description": "Generate code from a natural language prompt",
      "input_schema": {
        "type": "object",
        "properties": {
          "prompt": { "type": "string", "description": "What to build" }
        },
        "required": ["prompt"]
      }
    }
  ],
  "mcp_compatible": false
}
```

### 3️⃣ Full workflow
```bash
# Validate
npx @w3lshdog/hyper-agent validate .agents/my-agent/

# Strict mode (CI/production)
npx @w3lshdog/hyper-agent validate .agents/my-agent/ --strict

# Check memory health
npx @w3lshdog/hyper-agent memory check .agents/my-agent/

# Build registry then launch Studio
hyper-agent registry build .agents/
hyper-agent studio
# → http://localhost:4040 opens automatically 🖥️
```

---

## 🖥️ HyperAgent Studio

A **zero-dependency visual GUI** for your agent ecosystem. No build step. No npm install. Opens in 1 second.

```bash
# 1. Build your registry
hyper-agent registry build .agents/

# 2. Launch Studio
hyper-agent studio
# → Opens http://localhost:4040 automatically

# Custom port or headless/CI mode
hyper-agent studio --port 8080 --no-open
```

### 🎯 Studio Features

| Feature | Details |
|---------|---------|
| 🃴 Agent cards | Name, version, runtime chips, badges, MCP port, memory backend |
| 🔍 Live search | `/` focuses search — filters across name, description, tags, author |
| 🎨 Filter sidebar | Runtime, memory, badge, level (L1–L5), tags — all combinable |
| 📄 Detail pane | Full metadata, tool schemas with types, auto-generated markdown docs, copy button |
| 📊 Memory footer | Live Redis/Postgres dot indicators, auto-refresh every 30s |
| 🧩 Cluster builder | Click ⊕ on cards or drag to drop zone → auto-generates `cluster.json` |
| ⬇️ Download | One-click `cluster.json` download with port map + memory backends |
| ⌨️ Keyboard | `/` to search, `Escape` to deselect |

### 🖥️ How it works

```
hyper-agent studio
    │
    ├── GET /              → serves studio/index.html (35KB, single file)
    ├── GET /api/registry  → reads registry.json live (no restart needed)
    └── GET /api/memory    → TCP pings Redis/Postgres, returns health per-agent
```

### cluster.json output

The Cluster Builder exports `cluster.json` — a portable deployment config:

```json
{
  "cluster": "my-hyper-cluster",
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

> 💡 **Phase 4:** `cluster.json` feeds directly into `npm run graduate` — reads manifest paths, port map, and memory backends instead of scanning individual manifests.

---

## 🛡️ --strict Validation Mode

Run `--strict` for production-grade checks. Errors exit with code `1` (CI catches them automatically).

| Check | Level | What it does |
|-------|-------|--------------|
| ✅ Entrypoint exists | ERROR | manifest.entrypoint file must be on disk |
| 🔧 Runtime sanity | WARN | node → package.json · python → requirements.txt · deno → deno.json |
| 🔐 env_vars simulation | WARN | Each declared env_var checked against process.env + .env file |
| 🛰️ MCP port conflicts | ERROR | Scans all agents in a batch, flags duplicate ports |

> Strict **errors** fail the build. **Warnings** inform but don't block deploy.

---

## 🧠 Smart Memory Check

Ping your Redis or Postgres backend before deploy. Get instant health status and copy-paste `docker run` fixes if anything's offline.

```bash
hyper-agent memory check .agents/my-agent/     # single agent
hyper-agent memory check templates/ --all       # all agents
hyper-agent memory check . --redis-host 192.168.1.10 --pg-host db.myserver.com
```

| Backend | Port | What it does |
|---------|------|--------------|
| 🔴 Redis | 6379 | TCP ping + docker run tip if offline |
| 🐘 Postgres | 5432 | TCP ping + docker run tip if offline |
| — None | — | Reports stateless, no action needed |

> Exit code `1` if any backend offline — CI pipelines catch this automatically.

---

## 🌍 Agent Registry

```bash
hyper-agent registry build templates/ --out registry.json [--strict]
hyper-agent registry search --tags starter --runtime node --badge mcp-ready --level 3
hyper-agent registry show my-node-agent
```

### 🏅 Auto-Computed Badges

| Badge | Meaning |
|-------|---------|
| ⚡ MCP Ready | Agent declares MCP port |
| 🧠 Memory Enabled | Redis or Postgres memory configured |
| 🔧 Multi-Tool | 2+ tools declared in manifest |
| 🔐 Env Declared | env_vars present in manifest |
| 🚀 HyperCoder | Level 4+ agent |
| 👑 Elite | Level 5 BROski agent |
| 💚 Health Checked | Passed runtime validation |
| ✅ Verified | Built with --strict flag |

---

## 🧠 What It Does

- 🤖 **Agent Swarms** — Multiple agents working in parallel missions
- 🔌 **Tool Plugins** — Attach any tool (code gen, web search, DB access)
- 🌐 **Multi-Deploy** — Run in Discord, FastAPI, or standalone
- 🧩 **HyperCode Native** — Plug directly into V2.4's Hyper-Agents-Box
- 🎮 **Course-Gated Levels** — Agents unlock as students level up
- 📋 **Spec-Validated** — `hyper-agent-spec.json` ensures consistency
- 🌍 **Agent Registry** — Discover, search, inspect agents by tag, badge & level
- 🛡️ **Strict Mode CI** — Production-grade validation with exit codes
- 🧠 **Smart Memory Check** — Ping Redis/Postgres health, instant docker tips
- 🖥️ **HyperAgent Studio** — Visual GUI, cluster builder, live memory health

---

## 🎮 Course Levels — Agent Unlock System

| Level | Title | Can Build |
|-------|-------|-----------|
| 1 | HyperNewbie | Starter templates |
| 2 | Vibe Coder | Custom tools, Supabase agents |
| 3 | Agent Builder | Multi-tool, memory agents |
| 4 | HyperCoder | MCP-compatible, V2.4 deploy |
| 5 | BROski Elite 🔥 | Core contributions + Studio clusters |

---

## 🗺️ Roadmap

### ✅ Shipped (v3 + Phase 6)
- [x] `cli/index.js` — router entrypoint, clean help output
- [x] `cli/validate.js` — `--strict` mode with 4 runtime checks
- [x] `cli/registry.js` — `build`, `search`, `show` + 8 auto-badges
- [x] `cli/memory.js` — Smart Memory Check (Redis + Postgres + docker tips)
- [x] `cli/studio.js` — zero-dependency Node server on port 4040
- [x] `studio/index.html` — 35KB single-file GUI, no build step 🖥️
- [x] Cluster builder → `cluster.json` export
- [x] Live memory health indicators (auto-refresh 30s)
- [x] `hyper-agent-spec.json` — author-declared badges array
- [x] `hyper-agent status` — HyperCode V2.4 health check (all services)
- [x] `hyper-agent logs` — live log tail from HyperCode V2.4
- [x] `hyper-agent tokens award` — award BROski$ to a student by Discord ID
- [x] `hyper-agent agents list` — agent heartbeats + online status
- [x] `hyper-agent graduate` — manually trigger graduation for a student

### 🔜 Next Up
- [ ] 🌍 **Community Registry** — public discovery via GitHub Discussions + JSON feed
- [ ] 👁️ **`--watch` mode** — live re-validation on file change during dev
- [ ] 🚀 **One-click deploy** — Studio → deploy cluster to HyperCode V2.4
- [ ] 💳 **`hyper-agent stripe`** — CLI hook for live Stripe Checkout API

---

## 📁 Repo Structure

```
HyperAgent-SDK/
├── cli/
│   ├── index.js          # Router — dispatches all subcommands
│   ├── validate.js       # Validation (standard + --strict)
│   ├── registry.js       # Registry build / search / show
│   ├── memory.js         # Smart Memory Check (Redis + Postgres)
│   ├── studio.js         # 🖥️ HyperAgent Studio server (port 4040)
│   └── commands/
│       ├── status.js     # HyperCode V2.4 health check
│       ├── logs.js       # Live log tail
│       ├── tokens.js     # Award BROski$ by Discord ID
│       ├── agents.js     # Agent heartbeats + online status
│       └── graduate.js   # Trigger graduation for a student
├── studio/
│   └── index.html        # 35KB single-file GUI (no build step!)
├── docs/                 # Full SDK documentation
├── templates/            # Agent starter templates
├── hyper-agent-spec.json # The agent manifest schema
├── package.json
└── README.md
```

---

## 🔗 Used In

| Project | How |
|---------|-----|
| 🧠 [HyperCode V2.4](https://github.com/welshDog/HyperCode-V2.4) | Core agent orchestration engine |
| 🎓 [Hyper-Vibe-Coding-Course](https://github.com/welshDog/Hyper-Vibe-Coding-Course) | Powers BROski AI tutor agents |
| 🤖 [BROski-Bot](https://github.com/welshDog/BROski-Bot) | Discord bot agent layer |

---

## 🏗️ Ecosystem Architecture

```
HyperAgent-SDK  ←  YOU ARE HERE
↓ powers
HyperCode V2.4 (FastAPI backend)
↓ syncs with
Supabase (DB + Edge Functions)
↓ serves
Hyper-Vibe-Coding-Course (Next.js)
↓ visualised by
HyperAgent Studio 🖥️ (localhost:4040)
```

---

## 🤝 Contributing

We welcome contributions from everyone — especially neurodivergent devs! 🧠⚡

- Start here: [CONTRIBUTING.md](CONTRIBUTING.md)
- Bugs + ideas: [GitHub Issues](https://github.com/welshDog/HyperAgent-SDK/issues)

---

## 🛡️ License
[AGPL-3.0](LICENSE) — Open source forever. Built with ❤️ in Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿

---

<div align="center">

**Built for ADHD brains. Fast feedback. Real tools. No fluff.** 🧠⚡

*by [@welshDog](https://github.com/welshDog) — Lyndz Williams*

**A BROski is ride or die. We build this together. 🐶♾️🔥**

</div>
