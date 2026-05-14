# HyperAgent-SDK — Graduate Build + Trigger (Design)

**Status:** Approved for implementation

## Goal
Ship a usable Phase 4 “graduation” path in HyperAgent-SDK that:
- Builds a V2.4-ready deployment bundle from `cluster.json` (single shared `docker-compose.agents.yml`)
- Keeps the existing “trigger graduation” capability, with consistent secret handling

## Non-goals (v1)
- Automatic GitHub PR creation into HyperCode-V2.4
- Directly mutating HyperCode-V2.4 from the SDK
- License alignment work (README badge vs MIT files) as part of this change set

---

## User-facing CLI

### Command: Build a deployment bundle
`hyper-agent graduate build <path-to-cluster.json> --out <dir> [--strict] [--json]`

**Behavior**
- Reads and validates `cluster.json`
- For each agent, validates `manifest.json` using the existing strict validator (or equivalent internal call)
- Copies agent folders into `--out/agents/<agent-name>/`
- Generates:
  - `--out/docker-compose.agents.yml` (single shared compose file)
  - `--out/Dockerfile.<agent-name>` (one Dockerfile per agent, runtime-specific)
  - `--out/README.md` (run instructions and required env vars)
- Outputs a final summary table (human mode) or a JSON summary (`--json`)

**Exit codes**
- `0`: bundle created successfully
- `1`: validation or IO error (missing files, invalid JSON, duplicate ports, strict validation errors)

### Command: Trigger graduation (network call)
`hyper-agent graduate trigger <discord_id> [--tokens 500] [--json]`

**Behavior**
- Sends a POST to HyperCode V2.4 “graduate trigger” endpoint (existing behavior), with idempotent `source_id`
- Secret selection:
  - Prefer `COURSE_SYNC_SECRET`
  - Fallback to `SHOP_SYNC_SECRET` (backward compatibility)

**Exit codes**
- `0`: ok / already graduated
- `1`: network error, non-2xx (except 409 already graduated), malformed response

---

## Inputs

### cluster.json
Source of truth for the build command.

**Shape (current)**
```json
{
  "cluster": "my-hyper-cluster",
  "agents": [
    {
      "name": "code-agent",
      "manifest_path": ".agents/code-agent/manifest.json",
      "port": 3201,
      "memory": "redis"
    }
  ]
}
```

**Rules**
- `cluster`: required string (used for naming only)
- `agents`: required non-empty array
- Each agent requires:
  - `name`: string (used in output folder + compose service name)
  - `manifest_path`: path to a `manifest.json`
  - `port`: integer (required if manifest `mcp_compatible` is true; validated by strict validator)
  - `memory`: `none | redis | postgres` (optional; defaults to `none` if omitted)

---

## Build output layout

Given `--out out/`:

```
out/
  docker-compose.agents.yml
  README.md
  Dockerfile.<agent-name>
  agents/
    <agent-name>/
      manifest.json
      ... (agent folder copied from manifest directory)
```

Copy behavior:
- Copy the directory containing `manifest_path` into `out/agents/<agent-name>/`
- If the manifest’s own `name` differs from `cluster.json` agent `name`, the build fails (prevents silent mismatches)

---

## Compose generation rules

### Service naming
- Service name: `agent-<agent-name>`
- Container name: omitted (lets users run multiple clusters without collisions)

### Build + execution
- Build context: `./agents/<agent-name>`
- Dockerfile: `./Dockerfile.<agent-name>`

### Ports
- If manifest `mcp_compatible` is true, publish:
  - `127.0.0.1:<port>:<port>`
- Otherwise, no published ports by default

### Environment (baseline)
- `AGENT_ID=<agent-name>`
- If port is used: `PORT=<port>`

### Memory wiring
- `memory: redis`
  - `REDIS_URL=redis://redis:6379`
- `memory: postgres`
  - `DATABASE_URL=postgresql://postgres:hypercode@postgres:5432/hypercode` (documented default)
- `memory: none`
  - no memory env vars

### Networks
- Attach services to `agents-net`
- The generated compose will not define `agents-net` as external by default; README tells users how to:
  - Run standalone (compose defines the network)
  - Or join an existing HyperCode V2.4 network (user edits to `external: true`)

---

## Dockerfile generation

All Dockerfiles should:
- Avoid running as root where feasible (nice-to-have; not required for v1)
- Use the manifest `entrypoint` as the start command
- Install dependencies only if the corresponding files exist

### python runtime
- Base: `python:3.11-slim`
- If `requirements.txt` exists, install it
- Start: `python <entrypoint>`

### node runtime
- Base: `node:20-alpine`
- If `package-lock.json` exists, run `npm ci`; else if `package.json` exists, run `npm install --omit=dev`
- Start: `node <entrypoint>`

### deno runtime
- Base: `denoland/deno:alpine`
- Start: `deno run --allow-net --allow-env <entrypoint>`

---

## Validation and safety

### Fail-fast cases
- `cluster.json` missing / invalid JSON
- Empty `agents` list
- Any `manifest_path` missing or not a file
- Any strict validation errors on manifests
- Port collisions within the cluster (regardless of runtime)
- Manifest `mcp_compatible: true` but port missing or outside 3100–3999 (current V2.4 convention)

### Output quality
- Human output: short, scan-friendly, with a final table:
  - agent | runtime | port | memory | status
- `--json` output includes:
  - `outDir`, `cluster`, `agents[]`, `errors[]` (if any)

---

## Compatibility notes

### Secrets
`graduate trigger` must align with `tokens award` expectations:
- Use `COURSE_SYNC_SECRET` first (consistent with economy award endpoint usage)
- Fallback to `SHOP_SYNC_SECRET` for legacy installs

### Docs drift
README currently references “npm run graduate” in roadmap language. The v1 implementation will provide `hyper-agent graduate build` and `hyper-agent graduate trigger`. If README references conflict, update to match.

---

## Generated README requirements

The generated `--out/README.md` should include copy/paste snippets for both flows:

### Standalone run
- `docker compose -f docker-compose.agents.yml up -d --build`

### Join HyperCode V2.4 network (snippet)
Include a short snippet showing how to set the network as external:

```yaml
networks:
  agents-net:
    external: true
    name: hypercode-v2-4_agents-net
```

And a one-liner to find the real network name:

```bash
docker network ls | findstr agents-net
```

