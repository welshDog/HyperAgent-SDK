# Framework Adapters – HyperAgent-SDK ↔ LangGraph / CrewAI

> Design doc for connecting HyperAgent-SDK agents into external multi-agent runtimes (LangGraph + CrewAI) without breaking the core Hyperfocus ecosystem.

## Why this exists

- HyperAgent-SDK is the **shared agent interface standard** for the whole BROski / Hyperfocus ecosystem (HyperCode-V2.4, Hyper-Vibe Course, BROskiPets, Obsidian Brain).
- 2024–2026 agent research + frameworks (LangGraph, CrewAI, AutoGen, etc.) expect structured agents with roles, tools, memory, and stateful orchestration.
- We want **write-once agents** (defined by HyperAgent spec) that can be orchestrated by **many runtimes**, not locked into one framework.

So this doc defines a **ports-and-adapters pattern**:

- HyperAgent spec = "hexagon" core.
- LangGraph / CrewAI = outer adapters that understand the spec but never own it.

## Ground truth: HyperAgent spec

Source of truth lives in `hyper-agent-spec.json` and `.agents/*`.

Key concepts (simplified):

- `id` / `slug` / `version` – identity
- `role` / `description` – what the agent is for
- `capabilities` – high-level skill tags
- `execute_url` + `protocol` – how to call the agent (HTTP, internal orchestrator, etc.)
- `tools` – structured description of tools this agent can use
- `memory_sources` – RAG / state backends
- `state_schema` – shape of long-running state if needed
- `limits` / `auth` / `permissions` – safety + policy hints

Adapters MUST treat this spec as read-only. They can cache + transform, but never re-define agents.

## High-level mapping

This table shows how HyperAgent concepts map into LangGraph and CrewAI.

| Concept                | HyperAgent-SDK                             | LangGraph                                      | CrewAI                                           |
|------------------------|--------------------------------------------|-----------------------------------------------|-------------------------------------------------|
| Agent identity         | `id`, `slug`, `version`                    | Node name / graph node id                     | `name` field on `Agent`                         |
| Role / description     | `role`, `description`, `capabilities`      | Node metadata, tags                           | `role`, `goal`, `backstory`                     |
| Tools                  | `tools[]` (HTTP, MCP, DB, etc.)            | Python callables used inside node functions   | `tools` list (`@tool`-decorated functions)      |
| Memory / state         | `memory_sources`, `state_schema`          | Graph state object, persistence layer         | `memory` strategy, context injection            |
| Exec endpoint          | `execute_url` / orchestrator integration   | Node function that calls HyperCode/SDK agent  | `function`/`llm` that delegates into HyperCode  |
| Safety / policies      | `auth`, `limits`, `permissions`            | Guards + conditional edges                     | `allow_delegation`, custom guard logic          |

The adapters use this mapping to stay aligned with the spec.

---

## Adapter 1 – LangGraph bridge

### Goal

- Represent HyperCode / HyperAgent workflows as **LangGraph graphs**.
- Keep ALL real work inside existing agents (HyperCode, orchestrator, Docker infra).
- Use LangGraph only for **stateful orchestration** (graphs, retries, persistence).

### Shape

- New Python module (in whichever repo is orchestrating):

  - Example path: `adapters/langgraph_adapter.py`.
  - Imports `hyper-agent-spec.json` (or a hydrated Python model) as input.

- Core function:

```python
from langgraph.graph import StateGraph


def build_hyperagent_graph(agent_specs, workflow_edges, call_agent_fn):
    """Build a LangGraph StateGraph from HyperAgent specs.

    - agent_specs: list[HyperAgentSpec]
    - workflow_edges: list of (source_slug, target_slug)
    - call_agent_fn: callable(spec, state) -> dict (result)
    """
    graph = StateGraph()

    for spec in agent_specs:
        # Each agent becomes a node that delegates back into HyperCode/SDK
        def make_node(s):
            def node_fn(state):
                result = call_agent_fn(s, state)
                # adapter defines how to merge result into state
                return merge_state_with_result(state, result)

            return node_fn

        graph.add_node(spec.slug, make_node(spec))

    for source, target in workflow_edges:
        graph.add_edge(source, target)

    return graph
```

- `call_agent_fn` is responsible for actually calling HyperCode or whatever backend executes this agent (e.g. crew-orchestrator HTTP, SDK CLI, direct function call).
- `merge_state_with_result` encapsulates how LangGraph state is updated (e.g. adding logs, artifacts, status codes).

### Persistence & threads

- LangGraph supports persisted state and threads. The adapter chooses how to map:
  - `thread_id` ↔ HyperCode workflow instance id.
  - Persisted state ↔ Redis/Postgres tables in HyperCode.

Adapters SHOULD:

- Use existing HyperCode state models where possible (no duplicate state machines).
- Store only minimal reflection metadata in LangGraph’s persistence if HyperCode is already the source of truth.


## Adapter 2 – CrewAI bridge

### Goal

- Expose HyperAgents as CrewAI `Agent` objects.
- Let CrewAI handle **crew composition, task definitions, and human-in-the-loop**.
- Keep core behavior + tools inside HyperCode / agents.

### Shape

- New module, e.g. `adapters/crewai_adapter.py`.

- For each HyperAgent spec, create a thin wrapper:

```python
from crewai import Agent


def make_crewai_agent(spec, call_agent_fn):
    async def _run(task_input: dict | str):
        # Delegate to HyperCode/SDK agent
        result = await call_agent_fn(spec, task_input)
        # Expect a standard output field; adapter can be smarter here
        return result.get("output") or result

    return Agent(
        name=spec.slug,
        role=spec.role,
        goal=spec.description,
        backstory="HyperAgent-SDK agent bridged via HyperCode.",
        tools=[],  # keep CrewAI tools minimal; use HyperCode tools internally
        verbose=True,
        function=_run,
    )
```

- A Crew can then be assembled from these wrapped agents:

```python
from crewai import Crew


def build_hyperagent_crew(agent_specs, tasks, call_agent_fn):
    agents = [make_crewai_agent(s, call_agent_fn) for s in agent_specs]
    crew = Crew(agents=agents, tasks=tasks, verbose=True)
    return crew
```

### Tasks and tools

- CrewAI `Task` objects describe mission steps (description, expected_output, etc.).
- Tools inside the CrewAI layer can remain minimal; the heavy tools (Docker, DB, MCP, etc.) are still used by the underlying HyperCode agents.

This keeps your infra surface small and your safety patterns consistent.


## Agent Protocol & interoperability

LangGraph is rolling out an **Agent Protocol** standard that lets different frameworks talk over a common HTTP interface (runs, threads, store).

Adapter direction:

- Optionally expose a lightweight HTTP server that implements the Agent Protocol on top of HyperAgent-SDK.
- This makes it possible to:
  - Drive HyperAgents from LangGraph Studio.
  - Embed CrewAI or other frameworks as sub-agents wrapped in a LangGraph node.

This is an optional layer, but future-proof.


## Safety + Sacred Rules

We preserve all existing sacred rules:

- HyperAgent spec remains the **single source of truth** for agent shape.
- Framework adapters are **additive** only (no breaking changes to the spec).
- Docker / network / secrets rules stay enforced in HyperCode; frameworks never talk directly to kritical infrastructure except through existing agents.

Implementation rules:

- Adapters live under `docs/` and/or `adapters/` modules – they are documentation + glue, not a new core.
- All new modules must honour:
  - 4-space Python indentation.
  - No `.env` files in git.
  - No `docker.io` for socket agents.
  - Redis DB 1 = cache, DB 2 = rate limit (unchanged).


## Future extensions

- Add mapping helpers in TypeScript so HyperAgent-SDK can generate CrewAI/LangGraph config from `.agents/*`.
- Ship example workflows:
  - Code → test → heal → deploy (HyperCode pipeline).
  - Course publishing pipeline (Course ↔ HyperCode).
  - BROskiPets dNFT mission pipeline.
- Publish a stand-alone "HyperAgent Framework Adapters" package if the pattern proves stable.

---

**Status:** Design-level doc, ready for implementation.

**Intent:** Make HyperAgent-SDK the academic + practical bridge so Hyperfocus agents can be orchestrated by any modern framework without ever losing their BROski soul.