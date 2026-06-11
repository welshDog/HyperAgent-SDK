# LOOP_CONTEXT.md — HyperAgent-SDK
> Claude reads this before every loop on this repo.

---

## Stack
- TypeScript · npm package
- Package: `@w3lshdog/hyper-agent`
- Current version: 0.1.7
- Agent definitions via `manifest.json`
- Swarm coordination API

## Key Concepts
- Agents are defined in manifest.json — input schema + output contract
- Swarm = multiple agents coordinating toward one goal
- MCP bridge connects agents to the Brain vault (port 8100)

## Sacred Rules
- Never use `docker.io` for socket agents — always `docker-ce-cli`
- `npm run dev:frontend` not `npm run dev`
- Publish loop must bump version, run tests, THEN publish

## Key Files
- `manifest.json` — agent definitions
- `WHATSDONE.md` — never rebuild
- `CLAUDE.md` — sacred rules
