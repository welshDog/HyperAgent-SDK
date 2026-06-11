# LOOP_PUBLISH.md — npm Publish Loop
> Claude follows this EXACTLY when publishing a new version.

---

## Publish Loop Steps
```bash
# 1. Check current version
cat package.json | grep version

# 2. Run tests — must all pass before publish
npm test

# 3. Bump version (patch / minor / major)
npm version patch   # bug fix
npm version minor   # new feature
npm version major   # breaking change

# 4. Build
npm run build

# 5. Publish
npm publish --access public

# 6. Verify
npm view @w3lshdog/hyper-agent version
```

## Exit Condition
- `npm view @w3lshdog/hyper-agent version` shows new version ✅
- Commit SHA recorded in LOOP_REGISTRY.md
- WHATSDONE.md updated with new version + what changed
