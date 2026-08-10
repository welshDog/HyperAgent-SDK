"""Code -> test -> heal workflow using HyperCode's orchestrator."""

from __future__ import annotations

from typing import Any, Dict, List

from adapters.crew_orchestrator_client import CrewOrchestratorClient


WORKFLOW: List[Dict[str, Any]] = [
    {
        "slug": "coder-agent",
        "task_type": "code_generation",
        "description": "Implement the requested change and return a patch plus test notes.",
    },
    {
        "slug": "qa-engineer",
        "task_type": "quality_assurance",
        "description": "Run the relevant tests against the proposed change and report failures.",
    },
    {
        "slug": "healer-agent",
        "task_type": "failure_recovery",
        "description": "Diagnose test or service failures and propose a safe repair.",
    },
]


async def run_code_test_heal(mission: str, client: CrewOrchestratorClient | None = None) -> Dict[str, Any]:
    """Run the staged workflow through crew-orchestrator.

    The implementation deliberately keeps each stage explicit so a future
    LangGraph graph or CrewAI Crew can call the same stages.
    """

    runner = client or CrewOrchestratorClient()
    state: Dict[str, Any] = {
        "workflow_id": "hyperagent-code-test-heal",
        "input": mission,
        "requires_approval": True,
        "outputs": [],
    }

    for stage in WORKFLOW:
        spec = {"slug": stage["slug"], "role": stage["task_type"], "description": stage["description"]}
        stage_state = {**state, "task_type": stage["task_type"], "description": stage["description"]}
        result = await runner.call_agent(spec, stage_state)
        state["outputs"].append({"stage": stage["slug"], "result": result})
        state["last_result"] = result

    return state
