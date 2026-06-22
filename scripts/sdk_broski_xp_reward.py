#!/usr/bin/env python3
"""HyperFocus Z0ne - HyperAgent SDK BROski XP Reward Hook (thin wrapper -> _broski_hook_core).

Usage:
    python scripts/sdk_broski_xp_reward.py --xp 10 --reason session_start
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _broski_hook_core as core  # noqa: E402
import hooks_config as cfg  # noqa: E402

if __name__ == "__main__":
    sys.exit(core.run_xp_reward(
        label=cfg.LABEL,
        argv=sys.argv[1:],
        channel=cfg.XP_CHANNEL,
        db=cfg.XP_DB,
        source=cfg.XP_SOURCE,
    ))
