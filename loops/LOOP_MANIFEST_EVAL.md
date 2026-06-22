# LOOP_MANIFEST_EVAL.md — Agent Manifest Eval Loop
> The SDK is the ecosystem's AGENT INTERFACE STANDARD. This loop keeps it valid:
> no broken manifest/template/test can be pushed. Sibling to HyperCode's
> LOOP_EVO_EVAL — same wiring, different eval.

---

## The Loop (LOOP_TEMPLATE shape)

**REPO:** HyperAgent-SDK

**GOAL:** Every push keeps the agent-interface standard valid — schema, the
built-in templates, and the validation test-suite all pass.

**SUCCESS TEST:** `npm test` (72 tests) **and** `npm run test:templates` both exit `0`.
Today: **72/72 tests pass, all templates valid.**

---

## Trigger — local git pre-push GATE

GitHub Actions is billing-locked, so the live trigger is local (same pattern as evo):

- **Hook:** `scripts/git_hooks/pre-push` → installed at `.git/hooks/pre-push`
- Runs `npm test` + `npm run test:templates` before **every push**; **blocks** on any failure,
  printing the failing test/manifest.
- If `node_modules` is absent it **skips** (warns to run `npm install`) rather than false-blocking.
- **Install (after clone):** `cp scripts/git_hooks/pre-push .git/hooks/pre-push` (`chmod +x` on *nix)
- **Override:** `git push --no-verify` (emergency only)

---

## Closing the circle — registry logging

`HYPERFOCUS-LOOPS/scripts/run_sdk_eval_loop.py` runs the eval **and records the verdict** in
`LOOP_REGISTRY.md`:

```bash
python HYPERFOCUS-LOOPS/scripts/run_sdk_eval_loop.py
```
- **green** → `loop_log done` row (e.g. `green 72 tests + templates`)
- **fail** → `loop_log blocked` row naming what failed + the fix action

Use the pre-push hook as the always-on gate; use the runner for on-demand / scheduled
runs that should appear in the loop history.

## Exit / Done
- **Done** = pre-push gate green + loop logged in `LOOP_REGISTRY.md`.
- **Blocked** = a test/manifest/template failed → fix it, re-run, push. NICE ONE BROski♾️
