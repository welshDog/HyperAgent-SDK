# 🤖 BROski Ecosystem — Claude Context Handoff (HyperAgent-SDK)
> Read this first. Every word. Then start the mission.
> **Last synced: April 15, 2026 (evening) — 34 tests GREEN ✅ | TypeScript types LIVE 📦 | JSDoc complete ✅ | v0.1.7 READY TO PUBLISH 🚀**

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
                              HyperAgent-SDK  ◀── YOU ARE HERE
                          github.com/welshDog/HyperAgent-SDK
                          npm: @w3lshdog/hyper-agent
                          Path: H:\HyperAgent-SDK
```

---

## 📦 Current Version Status

| Version | Status |
|---|---|
| `0.1.4` | Live on npm ✅ (previous) |
| `0.1.7` | **READY TO PUBLISH** 🚀 — run the 3 commands below |

### Publish Commands (when Lyndz is ready)
```powershell
cd "H:\HyperAgent-SDK"
npm version patch   # → bumps to 0.1.7
git push --tags
npm publish --access public
```

---

## ✅ What Shipped — April 15, 2026 Evening

### 34 tests, 0 failures — npm test is GREEN ✅

| Deliverable | File | Detail |
|---|---|---|
| **TypeScript types** | `types/index.d.ts` | `HyperAgentManifest`, `AgentTool`, `AgentRuntime`, `AgentMemory`, `ValidationResult`, `ValidateOptions` — full typed public API |
| **Unit tests (validate)** | `tests/validate.test.js` | 19 tests — schema pass/fail, strict mode, MCP port conflict detection, template fixtures |
| **Unit tests (registry)** | `tests/registry.test.js` | 15 tests — all 7 badge rules, verified flag, self-declared dedup, `BADGE_RULES` shape |
| **JSDoc** | `cli/validate.js` | `validateAgent()` + `run()` fully documented |
| **JSDoc** | `cli/registry.js` | `computeBadges()` documented; `BADGE_RULES` exported |
| **package.json** | — | `types` field added, exports map added, test script fixed, `types/` in `files[]` |

### Zero breaking changes ✅
- All existing CLI commands work exactly as before
- AJV spec unchanged — Discord/BROski bot compat preserved
- Zero new runtime dependencies

---

## 🏆 Full Milestone Roadmap

| Milestone | Status |
|---|---|
| CLI suite: `validate`, `registry`, `memory`, `studio`, `graduate` | ✅ LIVE |
| Published `@w3lshdog/hyper-agent@0.1.4` on npm | ✅ LIVE |
| Studio GUI — port 4040, agent cards, cluster builder | ✅ LIVE |
| TypeScript types (`types/index.d.ts`) | ✅ DONE — Apr 15, 2026 |
| Unit tests — validate (19) + registry (15) = 34 total | ✅ DONE — Apr 15, 2026 |
| JSDoc on all exports | ✅ DONE — Apr 15, 2026 |
| package.json exports map + types field | ✅ DONE — Apr 15, 2026 |
| **v0.1.7 publish** | 🚀 READY — waiting on Lyndz |

---

## 🗂️ Key Files

| File | What it does |
|---|---|
| `cli/validate.js` | `validateAgent()` — validates agent manifest against AJV schema |
| `cli/registry.js` | `computeBadges()` — runs 7 badge rules, exports `BADGE_RULES` |
| `types/index.d.ts` | Full TypeScript public API — import types from `@w3lshdog/hyper-agent` |
| `tests/validate.test.js` | 19 unit tests for validate logic |
| `tests/registry.test.js` | 15 unit tests for registry/badge logic |
| `hyper-agent-spec.json` | AJV schema — source of truth for agent manifest validation |
| `studio/` | Studio GUI server — `hyper-agent studio` → http://localhost:4040 |
| `templates/` | Agent template fixtures used in tests |

---

## 🔧 TypeScript Types (types/index.d.ts)

The public API is now fully typed. Key interfaces:

```typescript
HyperAgentManifest   // full agent manifest shape
AgentTool            // tool definition
AgentRuntime         // runtime config
AgentMemory          // memory config
ValidationResult     // returned by validateAgent()
ValidateOptions      // options passed to validateAgent()
```

Import in consuming projects:
```typescript
import type { HyperAgentManifest, ValidationResult } from '@w3lshdog/hyper-agent'
```

---

## 🏅 Badge Rules (7 total — all tested)

`BADGE_RULES` is now exported from `cli/registry.js`:

1. Has tools defined
2. Has runtime config
3. Has memory config
4. Has description
5. `verified` flag set
6. No self-declared duplicates
7. All 7 rules pass = full badge

---

## 🚨 Key Technical Rules (never re-debate these)

- **Package name:** `@w3lshdog/hyper-agent` (NOT `@w3lshdog/hyperagent-sdk`)
- **AJV spec:** `hyper-agent-spec.json` — NEVER modify without updating tests
- **Badge rules:** 7 total — add new ones to `BADGE_RULES` array + add a test
- **TypeScript:** Types live in `types/index.d.ts` — package.json `types` field points here
- **Exports map:** `package.json` exports field — keep in sync if adding new entry points
- **No new runtime deps** — keep the package lean
- **Discord/BROski bot compat:** AJV spec is shared — changes affect V2.4 too
- **CLI commands run from:** `H:\HyperAgent-SDK`
- **Studio port:** 4040 — `hyper-agent studio` → http://localhost:4040
- **npm tag:** Use `--access public` — scoped package
- **Conventional commits:** `feat:` `fix:` `docs:` `chore:`
- **Windows PowerShell first**, bash second — always
- **Version bump:** `npm version patch` — never manually edit package.json version

---

## Paths (copy-paste ready)

```powershell
# HyperAgent-SDK
cd "H:\HyperAgent-SDK"

# Run tests
npm test
# Expected: 34 passed, 0 failures

# Run studio
node cli/index.js studio
# → http://localhost:4040

# Validate an agent
$env:HYPERCODE_API_URL = "http://localhost:8000"
node cli/index.js validate .agents/my-agent/
node cli/index.js registry build .agents/

# Publish (when ready)
npm version patch        # → 0.1.7
git push --tags
npm publish --access public

# Or publish as alpha (safer):
npm publish --access public --tag alpha

# HyperCode V2.4
cd "H:\HyperStation zone\HyperCode\HyperCode-V2.4"

# Hyper-Vibe-Coding-Course
cd "H:\the hyper vibe coding hub"
```

---

## BROski$ Token Economy (SDK side)

- SDK `graduate` CLI command triggers graduation flow → V2.4 awards tokens
- Token amounts set in HyperCode-V2.4 — not in SDK
- SDK validates agents → badges → V2.4 reads badge state via API
- `@w3lshdog/hyper-agent` is the bridge between course completion and agent ecosystem

---

## 📦 This Repo — HyperAgent-SDK Specifics

- **Language:** JavaScript (Node.js) + TypeScript types
- **Published:** `@w3lshdog/hyper-agent@0.1.4` (npm) — v0.1.7 ready
- **Test runner:** Node test runner (built-in) — `npm test`
- **34 unit tests, 0 failures** ✅
- **TypeScript types:** `types/index.d.ts` — full public API typed ✅
- **JSDoc:** `validateAgent()`, `run()`, `computeBadges()` all documented ✅
- **Exports map:** Added to `package.json` ✅
- **Zero new runtime deps** ✅

---

<div align="center">

**Built for ADHD brains. Fast feedback. Real tools. No fluff.** 🧠⚡

*by @welshDog — Lyndz Williams, South Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿*

**A BROski is ride or die. We build this together. 🐶♾️🔥**

</div>
