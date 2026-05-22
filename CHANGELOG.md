# Changelog

All notable changes to `@w3lshdog/hyper-agent` are documented here.

Format: [Semantic Versioning](https://semver.org/) — `feat:` `fix:` `docs:` `chore:`

---

## [0.4.0] — May 22, 2026

### feat
- **Web3/dNFT manifest types** — new optional `web3` block in `hyper-agent-spec.json` for agents that read or write on-chain state. Fields: `chain` (base / base-sepolia / ethereum / ethereum-sepolia), `token_standard` (ERC-721 / ERC-1155 / ERC-20), `dnft` (dynamic-NFT flag — the BROskiPets pet-evolve model), `contract_address` (`0x` + 40 hex), `capabilities` (mint / evolve / transfer / burn / read-metadata / read-balance), `signer_env_var`
- Two new registry auto-badges — `⛓️ web3-enabled` (any `web3` block) and `🛂 dnft` (`web3.dnft === true`)
- TypeScript types — `AgentWeb3`, `Web3Chain`, `TokenStandard`, `Web3Capability`, exported and mirrored on `HyperAgentManifest.web3`
- Validator hints for `web3.chain`, `web3.contract_address`, `web3.token_standard`

### chore
- Non-breaking + additive: `web3` is optional — every existing manifest still validates
- New unit tests — `web3` schema validation (8 cases) + the two new badge rules (4 cases)
- npm version bumped 0.3.0 → 0.4.0 (Sacred Rule #4: Web3/dNFT spec types require a v0.4.0 bump)

---

## [0.3.0] — April 30, 2026

### feat
- `awardFromCourse()` typed client — Phase 3 token sync helper, exported as `@w3lshdog/hyper-agent/client`
- Server-only by design — refuses to run in browser environments (`COURSE_SYNC_SECRET` never leaks)
- Idempotent via `sourceId`: replays return `{ source_id, duplicate: true }` (no double award)
- `AbortController` request timeout (default 5 s)
- Stable error codes: `INVALID_TOKENS`, `MISSING_SECRET`, `TIMEOUT`, `BAD_STATUS`, etc.
- TypeScript types for `AwardFromCourseInput`, `AwardFromCourseOptions`, `AwardFromCourseResult`, `AwardFromCourseError`

### chore
- Added 14 unit tests against a local mock V2.4 server
- Honours the contract in `AGENT_SYNC_NOTES.md` — Course repo can now `import { awardFromCourse } from '@w3lshdog/hyper-agent/client'`

---

## [0.2.0] — April 30, 2026

### feat
- `init` command — scaffold a new agent from a template: `hyper-agent init my-bot --template python|node|typescript|mcp`
- `typescript-starter` template — TypeScript agent with `tsconfig.json` and `tsx`-based dev loop
- `mcp-starter` template — MCP-compatible agent on port 3200 with `@modelcontextprotocol/sdk` skeleton
- Validator UX overhaul — AJV errors now mapped to human-readable hints (kebab-case, semver, port range, MCP-required-port, unknown-field, missing-required), de-duplicated, and linked back to the spec

### chore
- `npm test:templates` extended to validate all 4 starters
- Version 0.2.0 bundles the Phase 2 starter-pack expansion

---

## [0.1.6] — April 15, 2026

### feat
- CLI commands restructured — Phase 6 commands now live at `cli/commands/` (graduate, status, logs, tokens, agents)
- `status` command — checks all 29 HyperCode V2.4 containers
- `agents` command — lists all agent heartbeats and online status

### fix
- Corrected CLI command file paths (`cli/commands/graduate.js` not `cli/graduate.js`)
- Removed stale VITE_STRIPE_TOKEN_* env var references (TokensPage now uses createCheckoutSession)

### docs
- CLAUDE_CONTEXT.md fully synced: v0.1.6, 29 containers, Stripe LIVE, correct CLI paths
- CHANGELOG.md created (this file)

---

## [0.1.5] — April 14, 2026

### feat
- `tokens` command — award BROski$ to a student by Discord ID
- `logs` command — view recent logs from HyperCode V2.4
- Stripe Checkout API live at `/api/stripe/checkout` (Phase 10F)
- Locked Stripe prices: Starter £5/200 tokens, Builder £15/800, Hyper £35/2500

### chore
- Updated ecosystem to 26 → 29 containers across Docker Compose
- Phase 10B network isolation confirmed: `data-net` + `obs-net` internal

---

## [0.1.4] — April 13, 2026

### feat
- `graduate` command — manually trigger graduation for a student
- Phase 9 CVE elimination: agent-x 11 CRITICAL → 0 CRITICAL, 55 HIGH → 14 HIGH
- Phase 8 CI/CD Trivy security pipeline (GitHub Actions)
- Phase 7 Dockerfile hardening: non-root users, multi-stage rewrites across 19 Dockerfiles

### fix
- `docker-socket` agents: switched from `docker.io` to `docker-ce-cli` repo
- `jaraco.*` packages now explicitly pinned in all Dockerfiles

---

## [0.1.3] — April 12, 2026

### feat
- `status` command — Phase 6 terminal tools integration
- FastAPI upgraded to 0.117+ (Phase 10A)
- Docker Compose network isolation scaffolded (Phase 10B)

---

## [0.1.2] — April 10, 2026

### feat
- Phase 5: Structured JSON logging, MetricsMiddleware, `/health` + `/metrics`, Grafana dashboards
- Phase 4: GraduationEvent ORM, `/graduate/trigger`, Edge Function, Discord Graduate role
- Phase 3: AccessProvision, `/provision`, shop trigger → Discord DM with api_key

---

## [0.1.1] — April 8, 2026

### feat
- Phase 2: Token sync, CourseSyncEvent ORM, `/award-from-course`, dedup guards
- Phase 1: discord_id bridge, `/coursestats` Discord command, Edge Function fan-out
- Phase 0: Port conflicts resolved, xp-leaderboard, Alembic migration

### chore
- SDK published to npm as `@w3lshdog/hyper-agent`

---

## [0.1.0] — April 2026

### feat
- Initial release
- `validate` command — AJV validator with `--strict` mode
- `registry` command — build / search / show + 8 auto-computed badges
- `memory` command — TCP health pings for Redis + Postgres
- `studio` command — zero-dependency Node server, Studio GUI at http://localhost:4040
- `studio/index.html` — 35KB single-file GUI, no build step
- `hyper-agent-spec.json` — manifest validation schema

---

> 🐶♾️ Built by @welshDog — Lyndz Williams, South Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿
