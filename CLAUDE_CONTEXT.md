# 🤖 BROski Ecosystem — Claude Context Handoff (HyperAgent-SDK)
> Read this first. Every word. Then start the mission.
> **Last synced: April 30, 2026 — 57 tests GREEN ✅ | v0.3.0 SHIPPED 🚀 | Phase 3 Token Sync client LIVE 🔁**

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
| `0.2.0` | Live on npm ✅ — Phase 2 starter pack (init + 4 templates + validator UX) |
| `0.3.0` | **JUST SHIPPED** 🚀 — Phase 3 token sync client (`awardFromCourse()`) |

### Publish Workflow (already automated, just commit + push + publish)
```powershell
cd "H:\HyperAgent-SDK"
git add -A && git commit -m "feat: <change>"
npm version minor   # patch | minor | major
git push --follow-tags
npm publish --access public
```

---

## ✅ Phase 2 (0.2.0) — Starter Pack Expansion

| Deliverable | File | Detail |
|---|---|---|
| `init` command | `cli/commands/init.js` | `hyper-agent init my-bot --template python\|node\|typescript\|mcp` — copies template, rewrites manifest.name + package.json name, refuses non-empty dirs, kebab-case enforced |
| TypeScript starter | `templates/typescript-starter/` | `tsconfig.json` + `src/index.ts` + `tsx` dev loop |
| MCP starter | `templates/mcp-starter/` | port 3200, `mcp_compatible:true`, `@modelcontextprotocol/sdk` skeleton |
| Validator UX | `cli/validate.js` | AJV errors → human hints (kebab-case, semver, port range, MCP-required-port, unknown-field, missing-required), de-duplicated, links to spec |

## ✅ Phase 3 (0.3.0) — Token Sync Client

| Deliverable | File | Detail |
|---|---|---|
| `awardFromCourse()` | `cli/client.js` | Server-only typed client, idempotent via `sourceId`, `AbortController` timeout, stable error codes |
| Subpath export | `package.json` `exports["./client"]` | `import { awardFromCourse } from '@w3lshdog/hyper-agent/client'` |
| TS types | `types/index.d.ts` | `AwardFromCourseInput/Options/Result/Error` |
| Tests | `tests/client.test.js` | 14 tests against a local mock V2.4 server — headers, body, 200/409/401/500, timeout, validation |

---

## 🏆 Full Milestone Roadmap

| Milestone | Status |
|---|---|
| CLI suite: `validate`, `registry`, `memory`, `studio`, `graduate`, `status`, `logs`, `tokens`, `agents` | ✅ LIVE |
| Studio GUI — port 4040 | ✅ LIVE |
| TypeScript types (`types/index.d.ts`) | ✅ LIVE |
| Unit tests — validate (21) + registry (15) + init (7) + client (14) = **57 total** | ✅ LIVE |
| `init` command + 4 templates (python, node, typescript, mcp) | ✅ 0.2.0 |
| Validator UX — AJV → human hints | ✅ 0.2.0 |
| `awardFromCourse()` typed client (Phase 3) | ✅ 0.3.0 |
| **Plan B — Course repo migrates to `awardFromCourse()` import** | ⏳ NEXT — 5-min PR in `H:\the hyper vibe coding hub` |

---

## 🗂️ Key Files

| File | What it does |
|---|---|
| `cli/index.js` | CLI router — 9 commands (init, validate, registry, memory, studio, status, logs, tokens, agents, graduate) |
| `cli/validate.js` | `validateAgent()` + AJV schema validation + human error hints |
| `cli/registry.js` | `computeBadges()` — 7 badge rules, exports `BADGE_RULES` |
| `cli/client.js` | **NEW 0.3.0** — `awardFromCourse()` Course→V2.4 token sync helper |
| `cli/commands/init.js` | **NEW 0.2.0** — template scaffolder |
| `cli/commands/{status,logs,tokens,agents,graduate}.js` | Phase 6 ops commands talking to V2.4 |
| `types/index.d.ts` | Full TS public API |
| `tests/{validate,registry,init,client}.test.js` | 57 unit tests |
| `hyper-agent-spec.json` | AJV manifest schema — source of truth |
| `templates/{python,node,typescript,mcp}-starter/` | 4 agent templates, all valid |
| `studio/` | Studio GUI server — `hyper-agent studio` → http://localhost:4040 |

---

## 🔧 Public API (subpath exports)

```typescript
// Manifest validation
import { validateAgent } from '@w3lshdog/hyper-agent';
import type { HyperAgentManifest, ValidationResult } from '@w3lshdog/hyper-agent';

// Registry / badges
import { computeBadges, BADGE_RULES } from '@w3lshdog/hyper-agent/registry';

// Token sync (Phase 3) — server-only
import { awardFromCourse, AwardFromCourseError } from '@w3lshdog/hyper-agent/client';
```

### `awardFromCourse()` — the Phase 3 helper

```typescript
const result = await awardFromCourse({
  sourceId: txn.id,                  // ≤128 chars, idempotency key
  discordId: user.discord_id,        // ≤32 chars
  tokens: 50,                        // integer 1..10000
  reason: 'Course module complete',  // optional, ≤255 chars
});
// → { source_id, awarded, coins_balance, xp_balance, level } on 200
// → { source_id, duplicate: true, detail }                   on 409 (already processed)
// → throws AwardFromCourseError                              on validation/timeout/4xx/5xx
```

**Defaults:** `baseUrl` = `process.env.HYPERCODE_API_URL` (or `http://localhost:8000`); `secret` = `process.env.COURSE_SYNC_SECRET`; `timeoutMs` = 5000.
**Refuses to run in browser** — `COURSE_SYNC_SECRET` is server-only.

---

## 🏅 Badge Rules (auto-computed by `cli/registry.js`)

```
✅ Verified       → manifest.verified: true (manual override)
⚡ MCP Ready      → mcp_compatible: true
🧠 Memory Enabled → memory !== 'none'
🔧 Multi-Tool     → tools.length >= 3
🔐 Env Declared   → env_vars.length > 0
🚀 HyperCoder     → course_level >= 4
👑 Elite          → course_level >= 5
💚 Health Checked → health_check defined
```

---

## 🚨 Key Technical Rules (never re-debate these)

- **Package name:** `@w3lshdog/hyper-agent` (NOT `@w3lshdog/hyperagent-sdk`)
- **AJV spec:** `hyper-agent-spec.json` — NEVER modify without updating tests + V2.4 + Course
- **Subpath exports:** keep `package.json` `exports` map in sync when adding entry points
- **TypeScript:** Types live in `types/index.d.ts` — bump them whenever adding a public function
- **No new runtime deps** (current: `ajv`, `ajv-formats` only) — keep the package lean
- **Discord/BROski bot compat:** AJV spec is shared — changes affect V2.4 too
- **awardFromCourse:** server-only, never import in a browser bundle
- **Studio port:** 4040 — `hyper-agent studio` → http://localhost:4040
- **MCP port convention:** 3100-3199 writing, 3200-3299 code, 3300-3399 data, 3400-3499 discord, 3500-3599 automation
- **npm tag:** Use `--access public` — scoped package
- **Conventional commits:** `feat:` `fix:` `docs:` `chore:`
- **Windows PowerShell first**, bash second — always

---

## Paths (copy-paste ready)

```powershell
# HyperAgent-SDK
cd "H:\HyperAgent-SDK"

# Run all 57 tests
npm test

# Scaffold a new agent
node cli/index.js init my-bot --template python
node cli/index.js init my-mcp --template mcp

# Validate
node cli/index.js validate ./my-bot --strict

# Run studio
node cli/index.js studio
# → http://localhost:4040

# Token sync helper (Phase 3) — server-side only
$env:HYPERCODE_API_URL    = "http://localhost:8000"
$env:COURSE_SYNC_SECRET   = "your-secret-here"
node -e "require('./cli/client').awardFromCourse({sourceId:'t1',discordId:'123456789012345678',tokens:50}).then(console.log)"

# Publish workflow
git add -A && git commit -m "feat: <change>"
npm version minor        # 0.3.0 → 0.4.0
git push --follow-tags
npm publish --access public

# Sister repos
cd "H:\HyperStation zone\HyperCode\HyperCode-V2.4"
cd "H:\the hyper vibe coding hub"
```

---

## BROski$ Token Economy (SDK side)

- **Course → V2.4 award flow** is the SDK's `awardFromCourse()` (NEW 0.3.0)
- SDK `graduate` CLI command triggers graduation flow → V2.4 awards tokens
- Token amounts are set in **HyperCode-V2.4** — not in SDK
- SDK validates agents → registry computes badges → V2.4 reads badge state via API
- `@w3lshdog/hyper-agent` is the bridge between course completion and the agent ecosystem

---

## 📦 This Repo — HyperAgent-SDK Specifics

- **Language:** JavaScript (Node.js ≥18) + TypeScript types
- **Published:** `@w3lshdog/hyper-agent@0.3.0` (npm)
- **Test runner:** Node test runner (built-in) — `npm test`
- **57 unit tests, 0 failures** ✅
- **TypeScript types:** `types/index.d.ts` — full public API typed ✅
- **Subpath exports:** `.`, `./registry`, `./client` ✅
- **Templates:** 4 (python, node, typescript, mcp) ✅
- **Zero new runtime deps in 0.3.0** ✅

---

<div align="center">

**Built for ADHD brains. Fast feedback. Real tools. No fluff.** 🧠⚡

*by @welshDog — Lyndz Williams, South Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿*

**A BROski is ride or die. We build this together. 🐶♾️🔥**

</div>
