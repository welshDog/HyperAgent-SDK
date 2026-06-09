# 🤖 HyperAgent-SDK — CLAUDE.md

> **Read MASTER first:** [HyperCode-V2.4/CLAUDE.md](https://github.com/welshDog/HyperCode-V2.4/blob/main/CLAUDE.md)
> That file has: who Lyndz is, comms rules, all sacred rules, ecosystem map, AI behaviour.
> This file has: SDK-specific rules only.

---

## 📍 What This Repo Is

- **npm package:** `@w3lshdog/hyper-agent` (published as `0.1.7`, code is `0.4.0`)
- **Purpose:** Shared agent interface standard for HyperCode V2.4 + Hyper-Vibe-Coding-Course
- **Local path:** `H:\HYPERFOCUSZONE\HperCore\HyperAgent-SDK`
- **Write agents once, deploy anywhere in the Hyperfocus Zone ecosystem**

---

## 🔴 Sacred Rules — HyperAgent-SDK

| # | Rule | Why | Consequence if broken |
|---|---|---|---|
| 1 | **`hyper-agent-spec.json` is the contract — never break its schema** | V2.4 + Course both consume it | Breaking changes crash agent loading in both repos |
| 2 | **Bump npm version before publishing** | `0.1.7` on npm ≠ `0.4.0` in code — don't make this worse | Consumers silently get wrong version |
| 3 | **`graduate build` + `graduate trigger` CLI = IMPLEMENTED ✅** (`cli/commands/graduate.js`, `cli/lib/graduateBuild.js`, 3 tests green) | Design doc: `2026-05-15-graduate-build-design.md` | — |
| 4 | **Web3/dNFT `web3` block landed in spec + code v0.4.0 (May 22)** — any further schema change ships with another version bump | Spec versioning keeps Course + V2.4 in sync | Silent schema drift |
| 5 | **Commits: `feat:` `fix:` `docs:` `chore:` only** | Conventional commits, same as all repos | Changelog breaks |
| 6 | **`COURSE_SYNC_SECRET` first → fallback `SHOP_SYNC_SECRET`** | Graduate trigger auth priority | Wrong secret = auth failure on trigger |

---

## 📂 Key Files

```
hyper-agent-spec.json           — THE contract (agent manifest schema)
package.json                    — npm package config
cli/                            — graduate build + trigger CLI ✅ IMPLEMENTED
cli/commands/graduate.js        — graduate build + trigger entry point
cli/lib/graduateBuild.js        — build logic (generates docker-compose + manifests)
cli/lib/yaml.js                 — YAML helper
types/                          — TypeScript types
templates/                      — agent scaffold templates
.agents/                        — agent manifests
CLAUDE_CONTEXT.md               — extended SDK context
AGENT_SYNC_NOTES.md             — sync notes between repos
```

---

## ⚡ Graduate Build — IMPLEMENTED ✅

```bash
hyper-agent graduate build <cluster.json> --out <dir> [--strict] [--json]
hyper-agent graduate trigger <discord_id> [--tokens 500] [--json]
```

Build output:
```
out/
  docker-compose.agents.yml
  README.md
  Dockerfile.<agent-name>
  agents/<agent-name>/manifest.json
```

> Status: **IMPLEMENTED ✅** — `cli/commands/graduate.js` + `cli/lib/graduateBuild.js`,
> covered by `tests/graduate-build.test.js` (3 tests green). Designed May 15, shipped since.

---

> 🐶♾️ Part of the Hyperfocus z0ne — @welshDog
