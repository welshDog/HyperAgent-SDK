#!/usr/bin/env python3
"""HyperFocus Z0ne - HyperAgent SDK Session Start Hook.

Writes a .focus_session_start marker and checks core SDK files exist.
Exits 0 on pass, 1 on hard failure.
"""

import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SESSION_FILE = ROOT / ".focus_session_start"


def _ping(url):
    try:
        urllib.request.urlopen(url, timeout=3)
        return True
    except Exception:
        return False


def main() -> int:
    now = datetime.now()
    print("\n[SESSION START] HyperFocus Z0ne -- HyperAgent SDK")
    print("-" * 40)
    print("   Time    : " + now.strftime("%Y-%m-%d %H:%M:%S"))

    SESSION_FILE.write_text(now.isoformat())

    pkg_ok = (ROOT / "package.json").exists()
    spec_ok = (ROOT / "hyper-agent-spec.json").exists()
    cli_ok = (ROOT / "cli").is_dir()
    templates_ok = (ROOT / "templates").is_dir()
    studio_ok = _ping("http://localhost:4040")

    print("   package.json        : " + ("PASS found" if pkg_ok else "FAIL missing"))
    print("   hyper-agent-spec.json: " + ("PASS found" if spec_ok else "WARN missing"))
    print("   cli/                : " + ("PASS found" if cli_ok else "WARN missing"))
    print("   templates/          : " + ("PASS found" if templates_ok else "WARN missing"))
    print("   studio :4040        : " + ("PASS reachable" if studio_ok else "WARN offline (run npm run studio)"))
    print()

    if not pkg_ok:
        print("FAIL  Session start FAILED -- package.json not found.\n")
        return 1

    print("PASS  HyperAgent SDK session started. BROski forever! Let's build!\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
