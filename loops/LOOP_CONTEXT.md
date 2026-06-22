# LOOP_CONTEXT.md — HyperAgent-SDK
> Claude reads this before every loop on this repo.

---

## Stack
- Node.js (CLI in JS) + shipped TypeScript types (`types/index.d.ts`)
- Package: `@w3lshdog/hyper-agent`
- Current version: 0.4.0
- Purpose: shared agent interface standard — validate manifests, scaffold agents
- Deps: `ajv` + `ajv-formats` (JSON-schema manifest validation)

## Key Concepts
- Agents are defined in manifest.json — input schema + output contract
- Swarm = multiple agents coordinating toward one goal
- MCP bridge connects agents to the Brain vault (port 8100)

## Sacred Rules
- Publish loop must bump version, run tests (`npm test`), THEN publish
- Never commit `.env` files
- `git fetch` before ANY push — parallel auto-commits are running
> ⚠️ This is a pure npm package — the `docker-ce-cli` and `npm run dev:frontend` rules
> that get pasted into briefs belong to HyperCode/Course, NOT here. Don't apply them.

## Key Files
- `manifest.json` — agent definitions
- `WHATSDONE.md` — never rebuild
- `CLAUDE.md` — sacred rules
