#!/usr/bin/env python3
"""HyperFocus Z0ne - HyperAgent SDK Config Validator.

Enforces Sacred Rules on SDK source and spec files:
  - NEVER docker.io image references
  - NEVER 'from backend.app.' imports
  - WARN if hyper-agent-spec.json lacks required top-level keys
  - WARN on plain http:// references (prefer https://)

Usage:
    python scripts/sdk_config_validator.py hyper-agent-spec.json
    python scripts/sdk_config_validator.py cli/index.js
    python scripts/sdk_config_validator.py registry.json
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

_BANNED_IMAGE_PREFIXES = ("docker.io/", "index.docker.io/")
_BANNED_IMPORT_RE = re.compile(r"from\s+backend\.app\.")
_PLAIN_HTTP_RE = re.compile(r'http://(?!localhost|127\.0\.0\.1)', re.IGNORECASE)

_SPEC_REQUIRED_KEYS = {"$schema", "version", "agent"}


def _resolve_file(arg):
    p = Path(arg)
    if p.is_absolute():
        return p
    for base in (Path.cwd(), ROOT):
        candidate = base / p
        if candidate.exists():
            return candidate
    return Path.cwd() / p


def _validate_spec(file_path, errors, warnings):
    try:
        data = json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append("invalid JSON: " + str(e))
        return
    missing = _SPEC_REQUIRED_KEYS - set(data.keys())
    if missing:
        warnings.append("spec missing top-level keys: " + ", ".join(sorted(missing)))


def validate(file_path):
    errors = []
    warnings = []

    if not file_path.exists():
        errors.append("file not found: " + str(file_path))
        return errors, warnings

    try:
        text = file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        warnings.append("could not decode as UTF-8 -- skipping content checks")
        return errors, warnings

    if file_path.name == "hyper-agent-spec.json":
        _validate_spec(file_path, errors, warnings)

    for i, raw in enumerate(text.splitlines(), start=1):
        stripped = raw.strip()
        if not stripped:
            continue

        for prefix in _BANNED_IMAGE_PREFIXES:
            if prefix in stripped:
                errors.append("line " + str(i) + ": docker.io reference -- " + repr(stripped[:80]))

        if _BANNED_IMPORT_RE.search(stripped):
            errors.append("line " + str(i) + ": forbidden 'from backend.app.*' -- " + repr(stripped[:80]))

        if _PLAIN_HTTP_RE.search(stripped):
            warnings.append("line " + str(i) + ": plain http:// reference -- prefer https://")

    return errors, warnings


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/sdk_config_validator.py <file>")
        return 2

    file_path = _resolve_file(sys.argv[1])

    print("\n[CONFIG VALIDATOR] HyperFocus Z0ne HyperAgent SDK -- " + sys.argv[1])
    print("-" * 40)
    print("   Path: " + str(file_path))
    print()

    errors, warnings = validate(file_path)

    for w in warnings:
        print("   WARN  " + w)
    if warnings:
        print()

    if errors:
        for e in errors:
            print("   FAIL  " + e)
        print()
        print("FAIL  Validation FAILED -- " + str(len(errors)) + " error(s).\n")
        return 1

    print("PASS  " + file_path.name + " passed all Sacred Rules checks!")
    if warnings:
        print("      (" + str(len(warnings)) + " warning(s) -- non-blocking)")
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
