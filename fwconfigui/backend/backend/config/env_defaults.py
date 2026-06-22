"""Repo-contained local demo environment defaults."""

import os
from pathlib import Path


def _demo_root() -> Path:
    # fwconfigui/backend/backend/config/env_defaults.py -> fwconfigui/
    return Path(__file__).resolve().parents[3] / "test" / "abac-demo"


def apply_repo_demo_defaults() -> None:
    """Apply bundled ABAC demo paths and auth defaults when env vars are unset.

    Uses os.environ.setdefault only — existing values (from .env, Docker, K8s) win.
    No-op if the demo data directory is not present in the repo.
    """
    demo_root = _demo_root()
    if not demo_root.is_dir():
        return

    os.environ.setdefault("PFC_REPO", str(demo_root / "pfc-repo"))
    os.environ.setdefault("FORTIMGR_EXTRACT_REPO", str(demo_root / "fortimgr-extract"))
    os.environ.setdefault("WORKSPACE", str(demo_root / "workspace"))
    os.environ.setdefault("GENERATED_FOLDER_PREFIX", "generated")
    os.environ.setdefault("DEMO_MODE", "true")
    os.environ.setdefault("DEPLOYMENT_TYPE", "test")
    os.environ.setdefault("CURRENT_USER", "admin")
