# NEXT_SESSION_HANDOVER — 2026-05-26

## Status
- HyperAgent-SDK (`@w3lshdog/hyper-agent`) provides CLI + manifest spec + templates + Studio GUI.
- Tests are expected green per repo boot docs.

## Start Here
- Install: `npm install`
- Tests: `npm test`
- Studio: `npm run registry:build` then `npm run studio` (Studio on :4040)

## Known Drift (needs a decision)
- License text is inconsistent across docs/metadata (README vs package metadata). Confirm intended license and align.
- Version statements drift in boot docs vs `package.json`. Confirm intended “current” version and align docs.

## Next Tasks
- Decide + align: license + version references.
- Verify Web3/dNFT manifest block is fully supported by spec/types/tests (if it’s claimed as v0.4.0+).
