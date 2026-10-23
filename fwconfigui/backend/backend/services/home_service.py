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
_DEFAULT_RENDERED_FOLDER_PREFIX = "iac/fw"

_HOME_SETTINGS_KEYS = (
    "WORKSPACE",
    "TEMPLATES_GITREPO_GROUP",
    "RENDERED_GITREPO_GROUP",
    "RENDERED_FOLDER_PREFIX",
    "INFRA_REPO",
)

_SAMPLE_SETTINGS: Dict[str, str] = {
    "WORKSPACE": "~/workspace",
    "TEMPLATES_GITREPO_GROUP": "https://github.com/your-org/fw-templates",
    "RENDERED_GITREPO_GROUP": "https://github.com/your-org/fw-rendered",
    "RENDERED_FOLDER_PREFIX": _DEFAULT_RENDERED_FOLDER_PREFIX,
    "INFRA_REPO": "https://github.com/your-org/fw-infra",
}


def _home_settings_path() -> Path:
    """Path to the persisted fwconfig settings file (per-user, independent of WORKSPACE)."""
    return Path.home() / ".fwconfig" / "fwconfig.yaml"


def _read_saved_settings() -> Dict[str, str]:
    """Read persisted settings from ~/.fwconfig/fwconfig.yaml.

    Keys in the yaml file are lowercase env-var names (e.g. workspace).
    Returns a mapping keyed by the uppercase env-var names.
    """
    raw = read_yaml_dict(_home_settings_path())
    if not isinstance(raw, dict):
        return {}

    out: Dict[str, str] = {}
    for key in _HOME_SETTINGS_KEYS:
        val = str(raw.get(key.lower()) or "").strip()
        if val:
            out[key] = val
    return out


def apply_saved_home_settings() -> None:
    """Apply persisted fwconfig settings to env vars that are not already set."""
    saved = _read_saved_settings()
    for key, val in saved.items():
        if str(os.getenv(key, "") or "").strip():
            continue
        os.environ[key] = val
        logger.info("Applied saved home setting %s=%s", key, val)


def get_home_setting(name: str, env_fallback: bool = True) -> str:
    """Return a single Home setting value (saved file > env var).

    Args:
        name: Uppercase setting name (e.g. RENDERED_GITREPO_GROUP)
        env_fallback: When False, only the saved file value is used

    Returns:
        The setting value, or "" when unset
    """
    key = str(name or "").strip()
    if key not in _HOME_SETTINGS_KEYS:
        return ""
    saved = _read_saved_settings()
    val = str(saved.get(key) or "").strip()
    if val or not env_fallback:
        return val
    return str(os.getenv(key, "") or "").strip()


@log_all_methods()
class HomeService:
    """Service for Home tab tool settings."""

    def is_initialized(self) -> bool:
        """Return True when ~/.fwconfig/fwconfig.yaml exists.

        Returns:
            True if the settings file has been created
        """
        return _home_settings_path().is_file()

    def get_settings(self) -> Dict[str, str]:
        """Return current Home settings (saved file > env var > default).

        Reads ~/.fwconfig/fwconfig.yaml when it exists.

        Returns:
            Mapping of setting name to value.
        """
        saved = _read_saved_settings()

        out: Dict[str, str] = {}
        for key in _HOME_SETTINGS_KEYS:
            val = saved.get(key) or str(os.getenv(key, "") or "").strip()
            if not val and key == "WORKSPACE":
                val = _DEFAULT_WORKSPACE
            if not val and key == "RENDERED_FOLDER_PREFIX":
                val = _DEFAULT_RENDERED_FOLDER_PREFIX
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

        yaml_path = _home_settings_path()
        yaml_path.parent.mkdir(parents=True, exist_ok=True)
        write_yaml_dict(yaml_path, {k.lower(): v for k, v in out.items()})
        for key, val in out.items():
            os.environ[key] = val

        ensure_fwconfigfiles_root()
        return out
