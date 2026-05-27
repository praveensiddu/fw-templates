"""Workspace utilities for managing workspace paths and configuration."""

import logging
import os
from pathlib import Path

from typing import Optional

from backend.exceptions.custom import NotInitializedError
from backend.utils.yaml_utils import read_yaml_dict

logger = logging.getLogger("uvicorn.error")


def get_workspace_root() -> Path:
    """Get the workspace root directory.

    Uses env var WORKSPACE, defaulting to ~/workspace.
    """

    raw = str(os.getenv("WORKSPACE", "") or "").strip()
    if raw:
        return Path(raw).expanduser()
    return (Path.home() / "workspace").expanduser()


def _normalize_product_name(product: str) -> str:
    v = str(product or "").strip().lower()
    return v


def get_fwconfigfiles_root(product: Optional[str] = None) -> Path:
    """Get the root directory where fwconfig yaml files are stored.

    Root is always under: <WORKSPACE>/fwconfigfiles

    If product is provided, returns:
        <WORKSPACE>/fwconfigfiles/<lowercase(product)>

    Raises:
        NotInitializedError: If the root does not exist
    """

    root = get_workspace_root() / "fwconfigfiles"
    if not root.exists() or not root.is_dir():
        logger.warning("fwconfigfiles root directory not found: %s", root)
        raise NotInitializedError("fwconfigfiles")

    if product is None:
        return root

    p = _normalize_product_name(product)
    scoped = root / p
    scoped.mkdir(parents=True, exist_ok=True)
    return scoped


def get_product_templates_repo(product: Optional[str]) -> Path:
    root = get_fwconfigfiles_root(None)
    if not str(product or "").strip():
        return root
    prod_key = str(product or "").strip().upper()

    repo_name = ""
    try:
        products_path = get_settings_yaml_path("products.yaml")
        raw = read_yaml_dict(products_path)
        if isinstance(raw, dict) and prod_key:
            data = raw.get(prod_key)
            prod = data if isinstance(data, dict) else {}
            templates_repo = str(prod.get("templates-repo") or "").strip()
            parts = [p for p in templates_repo.split("/") if str(p or "").strip()]
            repo_name = str(parts[-1]).strip() if parts else ""
    except Exception:
        raise NotInitializedError(f"templates-repo field must be set for this product={product}")

    scoped = root / "cloned-repositories" / repo_name
    return scoped


def get_product_generated_repo(product: Optional[str]) -> Path:
    root = get_fwconfigfiles_root(None)
    if not str(product or "").strip():
        return root
    prod_key = str(product or "").strip().upper()

    repo_name = ""
    try:
        products_path = get_settings_yaml_path("products.yaml")
        raw = read_yaml_dict(products_path)
        if isinstance(raw, dict) and prod_key:
            data = raw.get(prod_key)
            prod = data if isinstance(data, dict) else {}
            repo_name = str(prod.get("generated-repo") or "").strip()
    except Exception:
        raise NotInitializedError(f"generated-repo field must be set for this product={product}")


    scoped = root / "cloned-repositories" / repo_name
    return scoped


def get_fwconfigfiles_product_repo_root(product: Optional[str]) -> Path:
    root = get_fwconfigfiles_root(None)
    if not str(product or "").strip():
        return root
    prod_key = str(product or "").strip().upper()

    repo_name = ""
    try:
        products_path = get_settings_yaml_path("products.yaml")
        raw = read_yaml_dict(products_path)
        if isinstance(raw, dict) and prod_key:
            data = raw.get(prod_key)
            prod = data if isinstance(data, dict) else {}
            repo_name = str(prod.get("generated-repo") or "").strip()
            if not repo_name:
                templates_repo = str(prod.get("templates-repo") or "").strip()
                parts = [p for p in templates_repo.split("/") if str(p or "").strip()]
                repo_name = str(parts[-1]).strip() if parts else ""
    except Exception:
        repo_name = ""

    if not repo_name:
        repo_name = _normalize_product_name(product)

    scoped = root / "cloned-repositories" / repo_name
    scoped.mkdir(parents=True, exist_ok=True)
    return scoped


def ensure_fwconfigfiles_root() -> Path:
    """Create the fwconfigfiles root directory if missing."""

    root = get_workspace_root() / "fwconfigfiles"
    root.mkdir(parents=True, exist_ok=True)
    return root


def get_pfc_settings_root() -> Path:
    pfc_repo_raw = str(os.getenv("PFC_REPO", "") or "").strip()
    if not pfc_repo_raw:
        raise NotInitializedError("PFC_REPO")
    root = Path(pfc_repo_raw).expanduser() / "settings"
    root.mkdir(parents=True, exist_ok=True)
    return root


def get_settings_yaml_path(filename: str) -> Path:
    fn = str(filename or "").strip()
    if not fn:
        raise ValueError("filename is required")
    if "/" in fn or "\\" in fn:
        raise ValueError("filename must be a base filename")
    return get_pfc_settings_root() / fn
