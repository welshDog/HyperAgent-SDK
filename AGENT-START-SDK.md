# 🧩 AGENT-START — HyperAgent-SDK Specific
> Repo-specific boot file for `HyperAgent-SDK`
> Read AGENT-START.md first, then this file.
> Last updated: May 21, 2026

---

## 🎯 THIS REPO'S MISSION

`@w3lshdog/hyper-agent` — the npm package for AI agent orchestration across the entire HyperFocus z0ne ecosystem. Defines agent manifests, swarm coordination, and the graduate build system.

**Current version:** `0.1.7` (needs bump to `0.4.0` for Web3/dNFT types)

---

## 📋 READ ORDER FOR THIS REPO

```
1. AGENT-START.md    → universal rules + skill loader
2. CLAUDE.md         → sacred rules (if exists)
3. WHATS_DONE.md     → what's built (check before every suggestion)
4. README.md         → SDK API reference
```

---

## ⚡ KEY COMMANDS

```bash
# Install
npm install @w3lshdog/hyper-agent

# Run tests
npm test
# Expected: 57 tests passing

# Validate agent manifest
npx hyper-agent validate

# Check registry
npx hyper-agent registry

# Agent status
npx hyper-agent status

# Publish new version
npm publish --access public
```

---

## 📦 SDK FEATURES (built)

- ✅ CLI: `validate`, `registry`, `studio`, `status`, `agents`, `tokens`, `graduate`
- ✅ `awardFromCourse` client — server-only, idempotency via `sourceId`
- ✅ TypeScript + MCP starter templates + `init` command
- ✅ 57 tests passing
- ⚠️ **NEEDS:** Web3/dNFT types in `hyper-agent-spec.json` — bump to v0.4.0

---

## 🔴 NEXT TASK

**v0.4.0 bump** — add Web3/dNFT types to `hyper-agent-spec.json`:
- Pet species types
- On-chain mint status
- Base Sepolia / Base mainnet network types
- dNFT evolution state

---

## 🔗 HOW IT CONNECTS

```
Hyper-Vibe-Coding-Course
    └── manifest.json (hyper-agent-spec)
            │
            └── HyperAgent-SDK (@w3lshdog/hyper-agent)
                        │
                        └── HyperCode-V2.4 (core backend)
                                    │
                                └── BROskiPets-LLM-dNFT (Web3)
```

---

> 🐶♾️ HyperAgent-SDK — Built by @welshDog
> *"Stop apologising for your brain. Start building."*
