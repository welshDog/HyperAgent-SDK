"""Sample adapter code: HyperAgent-SDK ↔ LangGraph / CrewAI.

This file is intentionally minimal. It shows how to:
- Turn HyperAgent specs into LangGraph nodes.
- Turn HyperAgent specs into CrewAI Agents.
- Delegate real execution back into HyperCode / HyperAgent runtime.

Sacred rules respected:
- 4-space indentation
- No .env handling here
- This module is glue only, not a new core
"""

from __future__ import annotations

from typing import Any, Awaitable, Callable, Dict, Iterable, Tuple

try:
    from langgraph.graph import StateGraph
except ImportError:  # pragma: no cover - optional dependency
    StateGraph = None  # type: ignore

try:
    from crewai import Agent as CrewAgent, Crew
except ImportError:  # pragma: no cover - optional dependency
    CrewAgent = None  # type: ignore
    Crew = None  # type: ignore


HyperAgentSpec = Dict[str, Any]
State = Dict[str, Any]
CallAgentFn = Callable[[HyperAgentSpec, State], Awaitable[Dict[str, Any]]]


def merge_state_with_result(state: State, result: Dict[str, Any]) -> State:
    """Very small, opinionated merge.

    Real implementations should live in HyperCode / backend and
    understand logs, artifacts, status codes, etc.
    """

    new_state = dict(state)
    outputs = list(new_state.get("outputs", []))
    outputs.append({
        "agent": result.get("agent_slug") or result.get("agent_id"),
        "status": result.get("status", "ok"),
        "data": result.get("output") or result,
    })
    new_state["outputs"] = outputs
    return new_state


def build_langgraph_from_hyperagents(
    agent_specs: Iterable[HyperAgentSpec],
    workflow_edges: Iterable[Tuple[str, str]],
    call_agent_fn: CallAgentFn,
):
    """Build a LangGraph StateGraph from HyperAgent specs."""

    if StateGraph is None:
        raise RuntimeError("langgraph is not installed; install to use this adapter.")

    graph = StateGraph(dict)

    for spec in agent_specs:
        slug = spec.get("slug") or spec.get("id")
        if not slug:
            raise ValueError("HyperAgent spec missing 'slug' or 'id'")

        def make_node(agent_spec: HyperAgentSpec):
            async def node_fn(state: State) -> State:
                result = await call_agent_fn(agent_spec, state)
                return merge_state_with_result(state, result)

            return node_fn

        graph.add_node(slug, make_node(spec))

    for source, target in workflow_edges:
        graph.add_edge(source, target)

    return graph


def make_crewai_agent(spec: HyperAgentSpec, call_agent_fn: CallAgentFn):
    """Wrap a HyperAgent spec as a CrewAI Agent."""

    if CrewAgent is None:
        raise RuntimeError("crewai is not installed; install to use this adapter.")

    slug = spec.get("slug") or spec.get("id") or "hyperagent"
    role = spec.get("role") or "HyperAgent"
    description = spec.get("description") or "HyperAgent-SDK agent bridged via adapter."

    async def _run(task_input: Any) -> Any:
        result = await call_agent_fn(spec, {"input": task_input})
        return result.get("output") or result

    return CrewAgent(
        name=slug,
        role=role,
        goal=description,
        backstory="HyperAgent-SDK agent bridged via HyperCode.",
        tools=[],
        verbose=True,
        function=_run,
    )


def build_crewai_crew(
    agent_specs: Iterable[HyperAgentSpec],
    tasks: Iterable[Any],
    call_agent_fn: CallAgentFn,
):
    """Build a CrewAI Crew from HyperAgent specs."""

    if Crew is None:
        raise RuntimeError("crewai is not installed; install to use this adapter.")

    agents = [make_crewai_agent(spec, call_agent_fn) for spec in agent_specs]
    return Crew(agents=agents, tasks=list(tasks), verbose=True)
