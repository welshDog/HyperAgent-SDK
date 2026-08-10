"""Async bridge from framework adapters to HyperCode crew-orchestrator."""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

import httpx


class CrewOrchestratorClient:
    """Small adapter client; HyperCode remains the execution authority."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = 60.0,
    ) -> None:
        self.base_url = (base_url or os.getenv("HYPERCODE_ORCHESTRATOR_URL", "http://localhost:8081")).rstrip("/")
        self.api_key = api_key or os.getenv("HYPERCODE_ORCHESTRATOR_API_KEY")
        self.timeout = timeout

    async def call_agent(self, spec: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatch one HyperAgent task and normalize the response."""

        slug = spec.get("slug") or spec.get("id")
        if not slug:
            raise ValueError("HyperAgent spec requires 'slug' or 'id'")

        task = {
            "id": state.get("workflow_id", "framework-adapter-run"),
            "type": state.get("task_type", "framework_adapter_task"),
            "description": state.get("input") or state.get("description", ""),
            "agents": [slug],
            "requires_approval": state.get("requires_approval", True),
            "context": state,
        }
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(f"{self.base_url}/execute", json={"task": task}, headers=headers)
            response.raise_for_status()
            payload = response.json()

        result = payload.get("results", {}).get(slug, payload)
        if isinstance(result, dict) and "result" in result:
            result = result["result"]
        if not isinstance(result, dict):
            result = {"output": result}
        result.setdefault("agent_slug", slug)
        result.setdefault("status", "ok")
        return result


async def call_agent_fn(spec: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
    """Drop-in callback for LangGraph/CrewAI adapter builders."""

    return await CrewOrchestratorClient().call_agent(spec, state)
