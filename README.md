# 🤖 HyperAgent-SDK

> Shared agent interface standard for the Hyperfocus Zone ecosystem.
> Write agents once — run them in **Hyper-Vibe-Coding-Course** and deploy to **HyperCode V2.4**.

---

## What Is This?

Two repos. One agent spec. The `manifest.json` is the **passport** — it's the bridge that lets a Course-built agent graduate into V2.4's production Hyper-Agents-Box.

```
Hyper-Vibe-Coding-Course  ──── manifest.json ────▶  HyperCode V2.4
   (.agents/ folder)          (hyper-agent-spec)     (Hyper-Agents-Box)
```

---

## Quick Start

### Validate an agent
```bash
npx hyper-agent validate .agents/my-agent/
```

### Validate all agents
```bash
npx hyper-agent validate .agents/
```

### Use a starter template
```bash
cp -r node_modules/hyper-agent/templates/python-starter .agents/my-new-agent
```

---

## `manifest.json` — Required Fields

| Field | Type | Example |
|-------|------|---------|
| `name` | string (kebab-case) | `"my-writing-agent"` |
| `version` | semver string | `"0.1.0"` |
| `runtime` | `python` \| `node` \| `deno` | `"python"` |
| `entrypoint` | string | `"main.py"` |
| `tools` | array (min 1) | see below |
| `mcp_compatible` | boolean | `false` |

### Minimal valid `manifest.json`
```json
{
  "name": "my-agent",
  "version": "0.1.0",
  "runtime": "python",
  "entrypoint": "main.py",
  "tools": [
    {
      "name": "do_the_thing",
      "description": "Does the thing",
      "input_schema": { "type": "object", "properties": {} }
    }
  ],
  "mcp_compatible": false
}
```

---

## Port Convention (for MCP agents)

| Range | Agent Type |
|-------|------------|
| 3100–3199 | Writing / content |
| 3200–3299 | Code review / dev |
| 3300–3399 | Data / research |
| 3400–3499 | Discord / social |
| 3500–3599 | Personal automation |

Only needed when `mcp_compatible: true`.

---

## Course Levels

The `course_level` field (1–5) gates which agents students can build:

| Level | Title | Can Build |
|-------|-------|----------|
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
