# LOOP_AGENT_SPEC.md — New Agent Loop Template
> Use this shape to build any new agent in a loop.

---

## Agent Loop Prompt Shape

**REPO:** HyperAgent-SDK
**GOAL:** Build agent: [Agent Name]
**SUCCESS TEST:** Agent registered in manifest.json, smoke test returns expected output, no TypeScript errors

### Agent Spec Template
```json
{
  "name": "[agent-name]",
  "description": "[what it does in one sentence]",
  "input": {
    "[param]": "[type + description]"
  },
  "output": {
    "[result]": "[type + description]"
  },
  "errorHandling": "[what to do on failure]",
  "loopExitCondition": "[when is this agent's job done]"
}
```

### Loop Process for a New Agent
1. Define spec in manifest.json
2. Implement handler function in TypeScript
3. Write smoke test
4. Run test → fix → repeat until passing
5. Commit + push + update LOOP_REGISTRY.md
