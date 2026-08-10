"""Fast, dependency-light tests for the framework adapter glue."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from adapters.code_test_heal_workflow import WORKFLOW, run_code_test_heal
from adapters.langgraph_crewai_sample import merge_state_with_result


class FakeClient:
    def __init__(self) -> None:
        self.calls = []

    async def call_agent(self, spec, state):
        self.calls.append(spec["slug"])
        return {"agent_slug": spec["slug"], "status": "ok", "output": state["input"]}


def test_state_merge_does_not_mutate_input():
    original = {"outputs": []}
    merged = merge_state_with_result(original, {"agent_slug": "coder-agent", "output": "patch"})
    assert original["outputs"] == []
    assert merged["outputs"][0]["agent"] == "coder-agent"


def test_workflow_order_is_code_test_heal():
    assert [stage["slug"] for stage in WORKFLOW] == ["coder-agent", "qa-engineer", "healer-agent"]


def test_workflow_dispatches_all_stages():
    client = FakeClient()
    result = asyncio.run(run_code_test_heal("Add adapter tests", client))
    assert client.calls == ["coder-agent", "qa-engineer", "healer-agent"]
    assert len(result["outputs"]) == 3
