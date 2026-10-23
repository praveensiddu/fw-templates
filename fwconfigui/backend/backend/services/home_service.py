"""Service for Home tab tool settings (workspace + git repositories)."""

import logging
import os
from pathlib import Path
from typing import Any, Dict

from backend.exceptions.custom import ValidationError
from backend.utils.logging_utils import log_all_methods
from backend.utils.workspace import ensure_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

logger = logging.getLogger("uvicorn.error")

_DEFAULT_WORKSPACE = "~/workspace"

_HOME_SETTINGS_KEYS = (
    "WORKSPACE",
    "TEMPLATES_GITREPO_GROUP",
    "RENDERED_GITREPO_GROUP",
    "INFRA_REPO",
)

_SAMPLE_SETTINGS: Dict[str, str] = {
    "WORKSPACE": "~/workspace",
    "TEMPLATES_GITREPO_GROUP": "https://github.com/your-org/fw-templates",
    "RENDERED_GITREPO_GROUP": "https://github.com/your-org/fw-rendered",
    "INFRA_REPO": "https://github.com/your-org/fw-infra",
}


def _home_settings_path() -> Path:
    """Path to the persisted Home settings file (per-user, independent of WORKSPACE)."""
    return Path.home() / ".fwconfigui" / "home.yaml"


def apply_saved_home_settings() -> None:
    """Apply persisted Home settings to env vars that are not already set."""
    saved = read_yaml_dict(_home_settings_path())
    if not isinstance(saved, dict):
        return
    for key in _HOME_SETTINGS_KEYS:
        if str(os.getenv(key, "") or "").strip():
            continue
        val = str(saved.get(key) or "").strip()
        if val:
            os.environ[key] = val
            logger.info("Applied saved home setting %s=%s", key, val)


@log_all_methods()
class HomeService:
    """Service for Home tab tool settings."""

    def get_settings(self) -> Dict[str, str]:
        """Return current Home settings (env var > saved file > default).

        Returns:
            Mapping of setting name to value.
        """
        saved = read_yaml_dict(_home_settings_path())
        if not isinstance(saved, dict):
            saved = {}

        out: Dict[str, str] = {}
        for key in _HOME_SETTINGS_KEYS:
            val = str(os.getenv(key, "") or "").strip() or str(saved.get(key) or "").strip()
            if not val and key == "WORKSPACE":
                val = _DEFAULT_WORKSPACE
            out[key] = val
        return out

    def get_samples(self) -> Dict[str, str]:
        """Return pre-prepared sample Home settings.

        Returns:
            Mapping of setting name to sample value.
        """
        return dict(_SAMPLE_SETTINGS)

    def save_settings(self, *, settings: Dict[str, Any]) -> Dict[str, str]:
        """Validate, persist and apply Home settings.

        Args:
            settings: Mapping of setting name to value

        Returns:
            The normalized settings that were saved

        Raises:
            ValidationError: If WORKSPACE is empty or not an absolute path
        """
        payload = settings if isinstance(settings, dict) else {}

        out: Dict[str, str] = {}
        for key in _HOME_SETTINGS_KEYS:
            out[key] = str(payload.get(key) or "").strip()

        if not out["WORKSPACE"]:
            logger.warning("Invalid field value for 'WORKSPACE': empty")
            raise ValidationError("WORKSPACE", "is required")

        if not Path(out["WORKSPACE"]).expanduser().is_absolute():
            logger.warning("Invalid field value for 'WORKSPACE': %s", out["WORKSPACE"])
            raise ValidationError("WORKSPACE", "must be an absolute path")

        write_yaml_dict(_home_settings_path(), dict(out))
        for key, val in out.items():
            os.environ[key] = val

        ensure_fwconfigfiles_root()
        return out
