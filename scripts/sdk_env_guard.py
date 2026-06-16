#!/usr/bin/env python3
"""HyperFocus Z0ne - HyperAgent SDK Env Guard.

Optional env vars (WARN if absent, never hard-fail -- SDK works without them locally):
  COURSE_SYNC_SECRET  — graduate trigger auth (primary, per Sacred Rule 6)
  SHOP_SYNC_SECRET    — graduate trigger auth (fallback)

Always exits 0.
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

_PLACEHOLDERS = {"", "changeme", "CHANGEME", "your_value_here", "paste_here", "CHANGEME_REQUIRED"}


def _load_env():
    env = {}
    for name in (".env.local", ".env"):
        f = ROOT / name
        if not f.exists():
            continue
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def main() -> int:
    print("\n[ENV GUARD] HyperFocus Z0ne -- HyperAgent SDK")
    print("-" * 40)

    env = {**_load_env(), **os.environ}

    course = env.get("COURSE_SYNC_SECRET", "")
    shop = env.get("SHOP_SYNC_SECRET", "")

    if course not in _PLACEHOLDERS:
        print("   PASS  COURSE_SYNC_SECRET present (primary graduate auth)")
    elif shop not in _PLACEHOLDERS:
        print("   WARN  COURSE_SYNC_SECRET absent -- SHOP_SYNC_SECRET present (fallback active)")
    else:
        print("   WARN  COURSE_SYNC_SECRET + SHOP_SYNC_SECRET both absent")
        print("         (non-fatal for local dev -- needed for graduate trigger)")

    print()
    print("PASS  Env guard passed (SDK -- graduate auth is optional for local work).\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
