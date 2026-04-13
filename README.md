# 🤖 HyperAgent-SDK
### Write Agents Once. Deploy Anywhere.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Made by WelshDog](https://img.shields.io/badge/Made_by-WelshDog_🦅-orange)](https://github.com/welshDog)

> **"The agent toolkit behind the Hyperfocus Zone — plug in, vibe out."**

HyperAgent-SDK is the orchestration layer for AI agents across the Hyperfocus Zone ecosystem.
Build once, deploy across Discord bots, FastAPI backends, and course platforms. 🧩

---

## 🔗 Used In

| Project | How |
|---------|-----|
| 🧠 [HyperCode V2.4](https://github.com/welshDog/HyperCode-V2.4) | Core agent orchestration engine |
| 🎓 [Hyper-Vibe-Coding-Course](https://github.com/welshDog/Hyper-Vibe-Coding-Course) | Powers BROski AI tutor agents |
| 🤖 [BROski-Bot](https://github.com/welshDog/BROski-Bot) | Discord bot agent layer |

---

## ⚡ Quick Start

```python
from hyperagent import HyperAgent

agent = HyperAgent(
    name="BROski",
    role="Neurodivergent coding tutor",
    tools=["code_gen", "explain", "debug"]
)

response = agent.run("Help me build a FastAPI endpoint")
print(response)
```

---

## 🧠 What It Does

- 🤖 **Agent Swarms** — Multiple agents working together
- 🔌 **Tool Plugins** — Attach any tool (code gen, web search, DB access)
- 🌐 **Multi-Deploy** — Run in Discord, FastAPI, or standalone
- 🧩 **HyperCode Native** — Designed to plug into V2.4 out of the box

---

## 🏗️ Ecosystem Architecture

```
HyperAgent-SDK
↓ powers
HyperCode V2.4 (FastAPI)
↓ syncs with
Supabase (DB + Edge Functions)
↓ serves
Hyper-Vibe-Coding-Course (Next.js)
```

---

## 🛡️ License
[AGPL-3.0](LICENSE) — Built with ❤️ in Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿
