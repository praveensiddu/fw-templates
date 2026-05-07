"""YAML file utilities."""

import logging
from pathlib import Path
from typing import Any, Dict, List

import yaml

logger = logging.getLogger("uvicorn.error")


def read_yaml_dict(path: Path) -> Dict[str, Any]:
    """Read a YAML file and return as dictionary."""

    if not path.exists() or not path.is_file():
        return {}
    try:
        raw = yaml.safe_load(path.read_text()) or {}
        return raw if isinstance(raw, dict) else {}
    except Exception:
        return {}


def write_yaml_dict(path: Path, data: Dict[str, Any], sort_keys: bool = False) -> None:
    """Write a dictionary to a YAML file."""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=sort_keys))


def list_yaml_files(root: Path) -> List[Path]:
    """List YAML files directly under root (non-recursive)."""

    if not root.exists() or not root.is_dir():
        return []
    out: List[Path] = []
    for p in sorted(root.iterdir()):
        if not p.is_file():
            continue
        if p.suffix.lower() not in {".yaml", ".yml"}:
            continue
        out.append(p)
    return out
