# 🤖 HyperAgent-SDK
### Write Agents Once. Deploy Anywhere.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![npm](https://img.shields.io/badge/npm-%40w3lshdog%2Fhyper--agent-red)](https://www.npmjs.com/package/@w3lshdog/hyper-agent)
[![Made by WelshDog](https://img.shields.io/badge/Made_by-WelshDog_🦅-orange)](https://github.com/welshDog)
[![Part of Hyperfocus Zone](https://img.shields.io/badge/Hyperfocus_Zone-♥️_Ecosystem-purple)](https://github.com/welshDog)

> **"The agent toolkit behind the Hyperfocus Zone — plug in, vibe out."**

HyperAgent-SDK is the orchestration layer for AI agents across the Hyperfocus Zone ecosystem.
Build once, deploy across Discord bots, FastAPI backends, and course platforms. 🧩

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

### 3️⃣ Validate & ship
```bash
npx @w3lshdog/hyper-agent validate .agents/my-agent/
# ✅ manifest.json valid — ready to deploy to HyperCode V2.4!

# 🔒 Strict mode (for CI/production)
npx @w3lshdog/hyper-agent validate .agents/my-agent/ --strict
```

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

## 🌍 Agent Registry

Build and search a local registry of your agents. Auto-computes badges from manifest data — no manual input needed.

```bash
# Build registry from your templates folder
hyper-agent registry build templates/ --out registry.json [--strict]

# Search agents by tag, runtime, badge, or level
hyper-agent registry search --tags starter --runtime node --badge mcp-ready --level 3

# Inspect a specific agent
hyper-agent registry show my-node-agent
```

### 🏅 Auto-Computed Badges

Badges are generated automatically when you run `registry build`:

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

> Authors can also declare optional badges in `hyper-agent-spec.json`: `featured`, `community-pick`, `experimental`

---

## 🧠 What It Does

- 🤖 **Agent Swarms** — Multiple agents working in parallel missions
- 🔌 **Tool Plugins** — Attach any tool (code gen, web search, DB access)
- 🌐 **Multi-Deploy** — Run in Discord, FastAPI, or standalone
- 🧩 **HyperCode Native** — Plug directly into V2.4's Hyper-Agents-Box
- 🎮 **Course-Gated Levels** — Agents unlock as students level up
- 📋 **Spec-Validated** — `hyper-agent-spec.json` ensures consistency across the ecosystem
- 🌍 **Agent Registry** — Discover, search, and inspect agents by tag, badge, and level
- 🛡️ **Strict Mode CI** — Production-grade validation with exit codes for CI pipelines

---

## 🎮 Course Levels — Agent Unlock System

| Level | Title | Can Build |
|-------|-------|-----------| 
| 1 | HyperNewbie | Starter templates |
| 2 | Vibe Coder | Custom tools, Supabase agents |
| 3 | Agent Builder | Multi-tool, memory agents |
| 4 | HyperCoder | MCP-compatible, V2.4 deploy |
| 5 | BROski Elite 🔥 | Core contributions |

---

## 🗺️ Roadmap

### ✅ Shipped (v2)
- [x] `cli/index.js` — router entrypoint with clean help output
- [x] `cli/validate.js` — `--strict` mode with 4 runtime checks
- [x] `cli/registry.js` — `build`, `search`, `show` subcommands
- [x] Auto-computed badge system (8 badges)
- [x] `hyper-agent-spec.json` — optional author-declared badges array

### 🔜 Coming Next (v3)
- [ ] **Smart Memory Provisioning** — `hyper-agent memory check` pings Redis/Postgres, shows health, suggests `docker run` if not running
- [ ] **HyperAgent Studio** — Visual GUI reads `registry.json`, drag-and-drop manifest clusters, real-time validation, auto docs
- [ ] **Community Registry** — Public discovery via GitHub Discussions + JSON feed
- [ ] **`--watch` mode** — Live re-validation on file change during development

---

## 📁 Repo Structure

```
HyperAgent-SDK/
├── cli/
│   ├── index.js          # Router entrypoint — dispatches subcommands
│   ├── validate.js       # Validation logic (standard + --strict)
│   └── registry.js       # Registry build / search / show
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
