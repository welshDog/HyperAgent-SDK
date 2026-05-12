# 🧠 AGENTS.md — HyperAgent-SDK

> **Dream it. Vibe it. Build it. HYPERFOCUS z0ne ♾️**

---

## 🗺️ What is this repo?

**HyperAgent-SDK** is the shared agent interface standard for the entire Hyperfocus z0ne ecosystem.

- Write agents once. Deploy anywhere across all 5 repos.
- Provides the base `HyperAgent` interface all agents must implement.
- Shared utilities, types, and helpers used by every repo.
- Published to npm for easy installation across the ecosystem.

---

## 🏗️ Ecosystem Architecture

```
HyperCode-V2.4 (backend / wallet authority)
    ↕
Hyper-Vibe-Coding-Course (frontend / earns XP + BROski$)
    ↕
BROskiPets-LLM-dNFT (reads progress → unlocks pets)
    ↕
HyperAgent-SDK (shared agent interface) ⬅️ YOU ARE HERE
    ↕
BROski-Obsidian-Brain (meta-layer / living knowledge vault)
```

---

## 🎯 Current Sprint (May 2026)

1. Keep SDK in sync with active ecosystem changes.
2. Publish updates to npm when interface changes land.
3. Update dependent repos (`HyperCode-V2.4`, `Hyper-Vibe-Coding-Course`) after publish.

---

## 🛠️ Skills Available (Antigravity)

| Skill | Location | Purpose |
|-------|----------|---------|
| `hyperagent-sdk-publish` | `.agents/skills/hyperagent-sdk-publish/` | Build, test, version, and publish the SDK to npm |

> Add new skills to `.agents/skills/<skill-name>/SKILL.md`

---

## 🔧 Tools & Connections

- **npm** — Package publishing target
- **TypeScript / JavaScript** — Primary SDK language
- **Jest** — Test runner
- **GitHub Actions** — CI for test + build on PRs
- **HyperCode-V2.4** — Primary SDK consumer (backend)
- **Hyper-Vibe-Coding-Course** — Primary SDK consumer (frontend)

---

## 📜 Sacred Rules (never break these)

- Short sentences. No walls of text.
- **Bold key info** where it adds clarity.
- PowerShell first for all commands.
- Bullet points over paragraphs.
- Never break existing interface contracts — **add, don't remove**.
- Never debate the sacred rules.

---

## 🏆 Major Wins So Far

- Shared agent interface standard defined ✅
- SDK consumed across HyperCode-V2.4 + Course ✅
- SDK publish skill ready ✅

---

## 🚀 How to Boot Into Hyperfocus Mode

1. Read `CLAUDE.md` — master brain, sacred rules, architecture.
2. Read `CLAUDE_CONTEXT.md` — current context snapshot.
3. Read `WHATS_DONE.md` — latest wins and sprint state.
4. Check `.agents/skills/` — available skills for this repo.
5. Ask: **"What are we shipping first today?"**

---

*Built with ADHD superpowers by Lyndz @ Hyperfocus Zone, S.Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿♾️*
