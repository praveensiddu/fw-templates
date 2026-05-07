"""Workspace utilities for managing workspace paths and configuration."""

import logging
import os
from pathlib import Path

from backend.exceptions.custom import NotInitializedError

logger = logging.getLogger("uvicorn.error")


def get_workspace_root() -> Path:
    """Get the workspace root directory.

    Uses env var WORKSPACE, defaulting to ~/workspace.

    Returns:
        Workspace root path
    """

    raw = str(os.getenv("WORKSPACE", "") or "").strip()
    if raw:
        return Path(raw).expanduser()
    return (Path.home() / "workspace").expanduser()


def get_fwconfigfiles_root() -> Path:
    """Get the root directory where fwconfig yaml files are stored.

    Root is always under: <WORKSPACE>/fwconfigfiles

    Raises:
        NotInitializedError: If the root does not exist
    """

    root = get_workspace_root() / "fwconfigfiles"
    if not root.exists() or not root.is_dir():
        logger.warning("fwconfigfiles root directory not found: %s", root)
        raise NotInitializedError("fwconfigfiles")
    return root


def ensure_fwconfigfiles_root() -> Path:
    """Create the fwconfigfiles root directory if missing."""

    root = get_workspace_root() / "fwconfigfiles"
    root.mkdir(parents=True, exist_ok=True)
    return root
