# 🤖 HyperAgent-SDK

> Shared agent interface standard for the Hyperfocus Zone ecosystem.
> Write agents once — run them in **Hyper-Vibe-Coding-Course** and deploy to **HyperCode V2.4**.

---

## Quick Start

```bash
# Validate an agent (no install needed)
npx @w3lshdog/hyper-agent validate .agents/my-agent/

# Validate all agents in a folder
npx @w3lshdog/hyper-agent validate .agents/

# Install as a dev dependency (for CI)
npm install -D @w3lshdog/hyper-agent
```

### Use a starter template

```bash
cp -r node_modules/@w3lshdog/hyper-agent/templates/python-starter .agents/my-new-agent
```

---

## What Is This?

Two repos. One agent spec. The `manifest.json` is the **passport** — it's the bridge that lets a Course-built agent graduate into V2.4's production Hyper-Agents-Box.

```
Hyper-Vibe-Coding-Course  ──── manifest.json ────▶  HyperCode V2.4
   (.agents/ folder)          (hyper-agent-spec)     (Hyper-Agents-Box)
```

---

## `manifest.json` — Required Fields

| Field | Type | Example |
|---|---|---|
| `name` | string (kebab-case, 3–50 chars) | `"my-writing-agent"` |
| `version` | semver string | `"0.1.0"` |
| `runtime` | `python` \| `node` \| `deno` | `"python"` |
| `entrypoint` | string | `"main.py"` |
| `tools` | array (min 1) | see below |
| `mcp_compatible` | boolean | `false` |

### Optional Fields

| Field | Type | Notes |
|---|---|---|
| `display_name` | string | Max 80 chars |
| `description` | string | Max 500 chars |
| `author` | string | Your name / handle |
| `memory` | `none` \| `redis` \| `postgres` | Default: `"none"` |
| `env_vars` | string[] | Required env var names |
| `port` | integer 3100–3999 | **Required when `mcp_compatible: true`** |
| `health_check` | string | Health check path |
| `tags` | string[] | Freeform labels |
| `course_level` | integer 1–5 | Gates course progression |

---

### Minimal valid `manifest.json`

```json
{
  "name": "my-agent",
  "version": "0.1.0",
  "runtime": "python",
  "entrypoint": "main.py",
  "tools": [
    {
      "name": "web_search",
      "description": "Search the web and return relevant results for a given query",
      "input_schema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "The search query to look up"
          }
        },
        "required": ["query"]
      }
    }
  ],
  "mcp_compatible": false
}
```

### MCP-compatible agent `manifest.json`

```json
{
  "name": "my-mcp-agent",
  "version": "0.1.0",
  "runtime": "node",
  "entrypoint": "index.js",
  "tools": [
    {
      "name": "summarise_document",
      "description": "Summarise a document given its URL",
      "input_schema": {
        "type": "object",
        "properties": {
          "url": { "type": "string", "description": "URL of the document" },
          "max_words": { "type": "integer", "description": "Max words in summary" }
        },
        "required": ["url"]
      }
    }
  ],
  "mcp_compatible": true,
  "port": 3200,
  "memory": "redis"
}
```

---

## Port Convention (for MCP agents)

> Only needed when `mcp_compatible: true`. The `port` field becomes **required**.

| Range | Agent Type |
|---|---|
| 3100–3199 | Writing / content |
| 3200–3299 | Code review / dev |
| 3300–3399 | Data / research |
| 3400–3499 | Discord / social |
| 3500–3599 | Personal automation |

---

## Course Levels

The `course_level` field (1–5) gates which agents students can build:

| Level | Title | Can Build |
|---|---|---|
| 1 | HyperNewbie | Starter templates |
| 2 | Vibe Coder | Custom tools, Supabase agents |
| 3 | Agent Builder | Multi-tool, memory agents |
| 4 | HyperCoder | MCP-compatible, V2.4 deploy |
| 5 | BROski Elite | Core contributions |

---

## Part of the Hyperfocus Zone Ecosystem

- 🏫 [Hyper-Vibe-Coding-Course](https://github.com/welshDog/Hyper-Vibe-Coding-Course) — learn by building
- 🚀 [HyperCode-V2.4](https://github.com/welshDog/HyperCode-V2.4) — the production platform
- 🤖 **HyperAgent-SDK** — you are here

---

*Built for ADHD brains. Fast feedback. Real tools. No fluff.* 🧠⚡
