---
name: hyperagent-sdk-publish
description: Builds, tests, versions, and publishes the HyperAgent-SDK package.
  Use when updating the shared agent interface, bumping versions, publishing
  to npm, or syncing SDK changes across the 5-repo ecosystem.
---

# hyperagent-sdk-publish Skill

## When to use
- Adding new agent interfaces or shared utilities to the SDK.
- Bumping the SDK version and publishing to npm.
- Syncing SDK updates into HyperCode-V2.4 or Hyper-Vibe-Coding-Course.
- Debugging SDK import errors across the ecosystem.

## Development flow
1. Make changes in `src/`.
2. Run tests:
   ```powershell
   npm test
   ```
3. Build:
   ```powershell
   npm run build
   ```
4. Check exports are correct in `dist/`.

## Version bump + publish
1. Bump version (patch/minor/major):
   ```powershell
   npm version patch   # or minor / major
   ```
2. Publish to npm:
   ```powershell
   npm publish --access public
   ```
3. Update SDK version in dependent repos:
   - `HyperCode-V2.4/package.json`
   - `Hyper-Vibe-Coding-Course/package.json`
   ```powershell
   npm install @welshdog/hyperagent-sdk@latest
   ```

## Agent interface rules
- Every agent must implement the base `HyperAgent` interface.
- Agents are write-once, deploy-anywhere across the ecosystem.
- Never break existing interface contracts — add, don't remove.

## Success criteria
- All tests pass before publish.
- New version visible on npm.
- Dependent repos updated and building without errors.

## Key env vars
- `NPM_TOKEN` (for publishing)
