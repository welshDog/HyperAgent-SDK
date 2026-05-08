---
name: sdk-publish
description: Ship a new version of @w3lshdog/hyper-agent to npm. Walks the gated test → commit → version-bump → push → publish → smoke-test flow with safety refusals. Use when the user says "publish", "ship the SDK", "release 0.x.0", "cut a patch/minor/major", or asks how to push a new version live.
---

# sdk-publish

The full ship-it workflow for `@w3lshdog/hyper-agent`. **Refuses to proceed** if any safety gate fails.

## Pre-flight Gates (ALL must pass)

Run these first. If any fails — stop, report, ask Bro how to proceed. Do not auto-fix.

```powershell
cd "H:\HyperAgent-SDK"

# 1. Working tree must be clean (no uncommitted changes)
git status --porcelain
# → empty output = clean ✅

# 2. Branch must be main
git rev-parse --abbrev-ref HEAD
# → main ✅

# 3. Tests must be 57/57 green
npm test
# → look for "tests 57" + "pass 57" + "fail 0" ✅

# 4. Logged into npm as welshdog
npm whoami
# → welshdog ✅

# 5. Templates valid
npm run test:templates
# → "All templates valid ✅"
```

If gate 1 fails → ask Bro to commit or stash.
If gate 2 fails → ask Bro if they really want to publish off main.
If gate 3 fails → STOP. Never publish red. Use `test-status-report` skill to triage.
If gate 4 fails → `npm login` then retry.
If gate 5 fails → fix the failing template before publishing.

## Pick the Bump

| Change kind | Bump | Example |
|---|---|---|
| Bug fix only, no API change | `patch` | 0.3.0 → 0.3.1 |
| New feature, backward compatible | `minor` | 0.3.1 → 0.4.0 |
| Breaking change to public API or `hyper-agent-spec.json` | `major` | 0.x.y → 1.0.0 |

If unsure → ask Bro. Default to `minor` for a new feature, `patch` for a fix.

## The Ship Sequence

```powershell
cd "H:\HyperAgent-SDK"

# 1. Stage + commit (use conventional-commit prefix)
git add -A
git commit -m "feat: <one-line summary>"
# Other prefixes: fix:, docs:, chore:, refactor:, test:

# 2. Bump version (this also creates the git tag automatically)
npm version patch    # or minor / major

# 3. Push commit + tag in one go
git push --follow-tags

# 4. Publish to npm (scoped → MUST use --access public)
npm publish --access public

# 5. Smoke test — verify the published version is live + works
npx @w3lshdog/hyper-agent@latest --version
# → should print the new version

# 6. Optional: scaffold a fresh agent end-to-end as a smoke test
$smokeDir = "$env:TEMP\hyper-smoke-$(Get-Random)"
npx @w3lshdog/hyper-agent@latest init $smokeDir --template python
npx @w3lshdog/hyper-agent@latest validate $smokeDir
Remove-Item -Recurse -Force $smokeDir
```

## After Ship

- Update `H:\HyperAgent-SDK\CLAUDE_CONTEXT.md` version table + roadmap section
- Update `H:\HyperAgent-SDK\.claude\skills\hypercode-sdk\SKILL.md` "Current State" snapshot
- If the publish included a `hyper-agent-spec.json` change → run the `cross-repo-sync` skill to mirror it into V2.4 + Course
- If you bumped the public API → confirm `types/index.d.ts` reflects the new surface

## Hard Rules

- **NEVER `--no-verify`** — if a hook fails, fix the underlying issue
- **NEVER amend a published commit** — create a new commit instead
- **NEVER force-push to main** — warn Bro if they ask
- **NEVER skip `--access public`** — the package is scoped (`@w3lshdog/...`), npm defaults to private and 402s
- **NEVER bump major without asking** — major bumps need conscious sign-off
- **NEVER publish if `npm test` is red** — even one failing test blocks ship

## If Publish Fails Mid-Flow

| Symptom | Likely cause | Fix |
|---|---|---|
| `402 Payment Required` | Missing `--access public` | re-run with the flag |
| `403 Forbidden` | Wrong npm user, or 2FA missing | `npm whoami`, then `npm login` |
| `EPUBLISHCONFLICT` / `403` "cannot publish over previously published" | Version already exists on npm | bump again with `npm version patch` |
| `git push` rejected | Branch behind remote | `git pull --rebase` first |
| Smoke test fetches old version | npm cache lag (1–60s) | wait + retry, or `npm view @w3lshdog/hyper-agent version` |

## Quick Recap (one-liner for vibes)

```powershell
npm test ; if ($?) { git add -A ; git commit -m "feat: x" ; npm version minor ; git push --follow-tags ; npm publish --access public }
```

(Use only when the gates have already been verified manually — the chain bails on the first failure but doesn't substitute for thinking.)
