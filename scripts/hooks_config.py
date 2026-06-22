#!/usr/bin/env python3
"""HyperFocus Z0ne - per-repo hook config for HyperAgent-SDK.

Consumed by the thin session_end + xp_reward wrappers (-> _broski_hook_core).

Intentionally bespoke (NOT wrapped):
  - sdk_env_guard.py       : warn-only, optional primary/fallback secrets
  - sdk_config_validator.py: validates SDK spec files, not a docker-compose
  - sdk_session_start.py    : repo-specific checks
"""

LABEL = "HyperAgent SDK"

# broski_xp_reward
XP_CHANNEL = "broski_economy"
XP_DB = 1
XP_SOURCE = "hyperagent_sdk_hook"
