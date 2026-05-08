---
name: test-status-report
description: Run the SDK test suite and produce a structured status report (per-file pass/fail, totals, duration, failure summaries). Use when the user says "test report", "status report", "are tests green", "run the suite and report", "what's the test state", or before/after publishing.
---

# test-status-report

Wraps `npm test` → parses → emits a clean status report in the BROski badge style. Use before every publish (gate for `sdk-publish`) and after any non-trivial code change.

## The Run

```powershell
cd "H:\HyperAgent-SDK"
npm test 2>&1 | Tee-Object -FilePath "$env:TEMP\hyper-test-output.log"
```

`npm test` runs `node --test tests/*.test.js`. Output is TAP format. Capture stdout+stderr.

## The Report Format

```
🧪 HyperAgent-SDK Test Report
=============================

📅 Run:        2026-MM-DD HH:MM:SS
⏱️  Duration:  X.XXs
🏷️  Version:   0.3.0
🌿 Branch:    main
🔖 Commit:    <short-sha>

📊 RESULTS
──────────
  ✅ tests/validate.test.js   21/21 pass   (Y.Yys)
  ✅ tests/registry.test.js   15/15 pass   (Y.Yys)
  ✅ tests/init.test.js        7/7  pass   (Y.Yys)
  ✅ tests/client.test.js     14/14 pass   (Y.Yys)
  ──────────────────────────────────────────
  TOTAL                       57/57 pass

🎯 STATUS: ALL GREEN ✅
```

If failures exist:

```
❌ STATUS: 2 FAILED

  tests/client.test.js  13/14 pass  ❌
    ✗ awardFromCourse — 401 path
      Expected error code 'BAD_STATUS', got 'TIMEOUT'
      at tests/client.test.js:142:12

  tests/registry.test.js  14/15 pass  ❌
    ✗ computeBadges — Multi-Tool boundary
      Expected ['🔧 Multi-Tool'], got []
      at tests/registry.test.js:88:5

🔧 NEXT ACTIONS
  1. node --test tests/client.test.js   ← isolate the failing file
  2. Read cli/client.js for the 401 path
  3. Use `token-sync-debug` skill if it's a real awardFromCourse regression
```

## How to Build the Report

Order of operations:

1. **Capture metadata** (run before the test):
   ```powershell
   $version = (Get-Content package.json | ConvertFrom-Json).version
   $branch  = git rev-parse --abbrev-ref HEAD
   $commit  = git rev-parse --short HEAD
   $start   = Get-Date
   ```

2. **Run + capture**:
   ```powershell
   $output = npm test 2>&1
   $exit   = $LASTEXITCODE
   $end    = Get-Date
   $duration = ($end - $start).TotalSeconds
   ```

3. **Parse TAP-ish Node test output**. Look for:
   - `# tests <N>` → total tests
   - `# pass <N>` → passes
   - `# fail <N>` → fails
   - `not ok <N> - <name>` → failing test names
   - Indented `at <file>:<line>` → failure location
   - Per-file: each test file emits its own block; group by file path

4. **Emit the report**. If `$exit -eq 0` → ALL GREEN. Else → list each failing test with its file, name, expected/actual, location.

5. **Save the report** for regression comparison:
   ```powershell
   $report | Out-File "$env:TEMP\hyper-test-report-latest.txt"
   ```
   Next run can diff against this to detect new failures vs. pre-existing.

## Quick One-Shot (when Bro just wants the badge)

```powershell
cd "H:\HyperAgent-SDK"
$out = npm test 2>&1
if ($LASTEXITCODE -eq 0) {
  $count = ($out | Select-String '# tests (\d+)').Matches.Groups[1].Value
  Write-Host "✅ $count/$count GREEN" -ForegroundColor Green
} else {
  $fails = ($out | Select-String '# fail (\d+)').Matches.Groups[1].Value
  Write-Host "❌ $fails failing — run full report" -ForegroundColor Red
}
```

## Regression Detection (compare to last run)

```powershell
$prev = Get-Content "$env:TEMP\hyper-test-report-latest.txt" -ErrorAction SilentlyContinue
# After current run, diff the failing-test sets:
#   - Tests failing now AND in $prev → existing failures (carry over)
#   - Tests failing now but NOT in $prev → 🚨 NEW REGRESSION (called this out loudly)
#   - Tests in $prev but passing now → ✅ NEWLY FIXED (celebrate)
```

## Hard Rules

- **Never claim green without running** — always actually execute `npm test`. No shortcuts.
- **Never trim failures** — show all of them, not just the first
- **Always include version + commit + branch** — the report is useless without provenance
- **If the run itself errors** (e.g. node missing, can't find tests dir) → report the run-level failure, don't pretend it was a test failure

## Expected Baseline (as of v0.3.0)

```
tests/validate.test.js   21
tests/registry.test.js   15
tests/init.test.js        7
tests/client.test.js     14
─────────────────────────
TOTAL                    57
```

If TOTAL drops below 57 → tests were deleted or skipped, that's a regression by itself. Surface it.

If TOTAL is above 57 → great, new tests landed. Update the baseline in this skill + in `hypercode-sdk` skill.

## Pairs With

- `sdk-publish` — uses this skill as a pre-flight gate (gate 3)
- `phase-4-graduation` — when adding `tests/graduate.test.js`, update baseline
- `token-sync-debug` — when `tests/client.test.js` regresses, this is the entry point
