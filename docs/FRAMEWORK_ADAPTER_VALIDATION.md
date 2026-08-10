# Framework Adapter Validation

## Purpose

This validation layer proves that HyperAgent-SDK can expose its agents to LangGraph and CrewAI while HyperCode remains the execution authority.

## Local setup

PowerShell:

```powershell
python -m venv .venv-adapters
.\.venv-adapters\Scripts\Activate.ps1
python -m pip install -r adapters/requirements-frameworks.txt
python -m pytest tests/test_framework_adapters.py -q
python -m compileall -q adapters tests/test_framework_adapters.py
```

Linux/macOS:

```bash
python3 -m venv .venv-adapters
source .venv-adapters/bin/activate
python -m pip install -r adapters/requirements-frameworks.txt
python -m pytest tests/test_framework_adapters.py -q
python -m compileall -q adapters tests/test_framework_adapters.py
```

## Connecting HyperCode

Set these environment variables at runtime. Do not commit them:

```text
HYPERCODE_ORCHESTRATOR_URL=http://localhost:8081
HYPERCODE_ORCHESTRATOR_API_KEY=<orchestrator-key>
```

The adapter sends `POST /execute` with the existing HyperCode task envelope and forwards `X-API-Key` when configured. The sample workflow runs `coder-agent` → `qa-engineer` → `healer-agent` in explicit order.

## Safety

- The workflow defaults to `requires_approval=true`.
- Frameworks do not receive Docker socket access.
- Secrets remain environment or Docker-secret managed.
- The adapters are glue; HyperCode remains the runtime authority.

## Release gate

Before merging or publishing a new SDK version:

1. Run the local commands above.
2. Confirm the GitHub Actions workflow is green.
3. Run an integration smoke test against a local crew-orchestrator.
4. Review the generated diff and permissions.
5. Merge the pull request.
6. Publish a patch release only after the adapter contract is stable.
