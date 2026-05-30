import re
import os
from pathlib import Path
from typing import Any, Dict, List

from backend.exceptions.custom import ValidationError
from backend.utils.workspace import get_settings_yaml_path
from backend.utils.yaml_utils import list_yaml_files, read_yaml_dict, write_yaml_dict


def list_yaml_files_recursive(root: Path) -> List[Path]:
    if not root.exists() or not root.is_dir():
        return []
    out: List[Path] = []
    for p in sorted(root.rglob("*")):
        if not p.is_file():
            continue
        if p.suffix.lower() not in {".yaml"}:
            continue
        out.append(p)
    return out


def get_generated_folder_prefix() -> str:
    prefix = str(os.getenv("GENERATED_FOLDER_PREFIX", "") or "").strip()
    if not prefix:
        raise ValidationError("GENERATED_FOLDER_PREFIX", "env var is required")
    return prefix


def get_product_generated_repo_name(*, product: str) -> str:
    raw = read_yaml_dict(get_settings_yaml_path("products.yaml"))
    if not isinstance(raw, dict):
        raw = {}

    prod_key = str(product or "").strip().upper()
    prod = raw.get(prod_key) if prod_key else None
    if not isinstance(prod, dict):
        prod = {}

    generated_repo = str(prod.get("generated-repo") or "").strip()
    if not generated_repo:
        raise ValidationError("generated-repo", "is required on product")

    parts = [p for p in generated_repo.split("/") if p]
    if not parts:
        raise ValidationError("generated-repo", "invalid format")
    repo_name = str(parts[-1]).strip()
    if not repo_name:
        raise ValidationError("generated-repo", "invalid format")
    return repo_name


def get_product_templates_repo_name(*, product: str) -> str:
    raw = read_yaml_dict(get_settings_yaml_path("products.yaml"))
    if not isinstance(raw, dict):
        raw = {}

    prod_key = str(product or "").strip().upper()
    prod = raw.get(prod_key) if prod_key else None
    if not isinstance(prod, dict):
        prod = {}

    templates_repo = str(prod.get("templates-repo") or "").strip()
    if not templates_repo:
        raise ValidationError("templates-repo", "is required on product")

    parts = [p for p in templates_repo.split("/") if p]
    if not parts:
        raise ValidationError("templates-repo", "invalid format")
    repo_name = str(parts[-1]).strip()
    if not repo_name:
        raise ValidationError("templates-repo", "invalid format")
    return repo_name


def read_fortimgr_addrs_dict(fm_addrs_dir: Path) -> Dict[str, str]:
    fortimgr_addrs_dict: Dict[str, str] = {}
    for p in list_yaml_files_recursive(fm_addrs_dir):
        doc = read_yaml_dict(p)
        if not isinstance(doc, dict):
            continue
        for k, v in doc.items():
            key = str(k or "").strip()
            val = str(v or "").strip()
            if key and val:
                fortimgr_addrs_dict[key] = val
    return fortimgr_addrs_dict


def read_fortimgr_groups_dict(fm_groups_dir: Path) -> Dict[str, List[str]]:
    fm_groups_dict: Dict[str, List[str]] = {}
    if not fm_groups_dir.exists() or not fm_groups_dir.is_dir():
        return fm_groups_dict

    for p in list_yaml_files_recursive(fm_groups_dir):
        doc = read_yaml_dict(p)
        if not isinstance(doc, dict):
            continue
        for group_name, members_raw in doc.items():
            g = str(group_name or "").strip()
            if not g:
                continue
            if not isinstance(members_raw, list):
                continue

            members: List[str] = []
            for m in members_raw:
                s = str(m or "").strip()
                if not s:
                    continue
                s = re.sub(r"\([^)]*\)", "", s).strip()
                if s:
                    members.append(s)

            if members:
                fm_groups_dict[g] = members

    return fm_groups_dict


def read_fortimgr_addrs_for_env(*, env: str) -> Dict[str, str]:
    fm_root_raw = str(os.getenv("FORTIMGR_EXTRACT_REPO", "") or "").strip()
    if not fm_root_raw:
        raise ValidationError("FORTIMGR_EXTRACT_REPO", "env var is required")

    fm_root = Path(fm_root_raw).expanduser()
    fm_addrs_dir = fm_root / env / "addrobjs"
    if not fm_addrs_dir.exists() or not fm_addrs_dir.is_dir():
        raise ValidationError(
            "FORTIMGR_EXTRACT_REPO",
            f"missing dir '{fm_addrs_dir}' Make sure FORTIMGR_EXTRACT_REPO is an absolute folder",
        )

    return read_fortimgr_addrs_dict(fm_addrs_dir)


def read_fortimgr_groups_for_env(*, env: str) -> Dict[str, List[str]]:
    fm_root_raw = str(os.getenv("FORTIMGR_EXTRACT_REPO", "") or "").strip()
    if not fm_root_raw:
        raise ValidationError("FORTIMGR_EXTRACT_REPO", "env var is required")

    fm_root = Path(fm_root_raw).expanduser()
    fm_groups_dir = fm_root / env / "expgrps"
    return read_fortimgr_groups_dict(fm_groups_dir)


def build_fortimgr_matched_groups_for_env(*, env: str, product_addr_match_dict: Dict[str, str]) -> Dict[str, Dict[str, Any]]:
    fm_root_raw = str(os.getenv("FORTIMGR_EXTRACT_REPO", "") or "").strip()
    if not fm_root_raw:
        raise ValidationError("FORTIMGR_EXTRACT_REPO", "env var is required")

    fm_root = Path(fm_root_raw).expanduser()
    fm_groups_dir = fm_root / env / "expgrps"
    fm_groups_dict = read_fortimgr_groups_dict(fm_groups_dir)

    product_addr_names = set(product_addr_match_dict.keys())
    matched_groups: Dict[str, Dict[str, Any]] = {}
    for gname, members in fm_groups_dict.items():
        if any(m in product_addr_names for m in members):
            matched_groups[gname] = {"in-firewall": True, "members": list(members)}

    return matched_groups


def read_existing_group_names(*, groups_dir: Path, excluded_filenames: set[str] | None = None) -> set[str]:
    existing_group_names: set[str] = set()
    exclude = {str(x).strip().lower() for x in (excluded_filenames or {"fm_extract_groups.yaml"}) if str(x).strip()}
    for p in list_yaml_files(groups_dir):
        if str(p.name).strip().lower() in exclude:
            continue
        doc = read_yaml_dict(p)
        if not isinstance(doc, dict):
            continue
        groups = doc.get("groups")
        if not isinstance(groups, dict):
            continue
        for k in groups.keys():
            name = str(k or "").strip()
            if name:
                existing_group_names.add(name)
    return existing_group_names


def read_existing_addresses(*, address_dir: Path, excluded_filenames: set[str] | None = None) -> Dict[str, Dict[str, Any]]:
    existing: Dict[str, Dict[str, Any]] = {}
    exclude = {str(x).strip().lower() for x in (excluded_filenames or {"fm_extract_address.yaml"}) if str(x).strip()}
    for p in list_yaml_files(address_dir):
        if str(p.name).strip().lower() in exclude:
            continue
        doc = read_yaml_dict(p)
        if not isinstance(doc, dict):
            continue
        addrs = doc.get("addresses")
        if not isinstance(addrs, dict):
            continue
        for k, v in addrs.items():
            name = str(k or "").strip()
            if not name:
                continue
            existing[name] = dict(v) if isinstance(v, dict) else {}
    return existing


def build_address_used_in_group_metadata(*, env: str, address_dir: Path, metadata_dir: Path) -> Dict[str, Any]:
    address_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)

    addr_names: Dict[str, str] = {}
    for p in list_yaml_files(address_dir):
        doc = read_yaml_dict(p)
        if not isinstance(doc, dict):
            continue
        addrs = doc.get("addresses")
        if not isinstance(addrs, dict):
            continue
        for k in addrs.keys():
            name = str(k or "").strip()
            if name:
                addr_names[name] = name

    fm_groups_dict = read_fortimgr_groups_for_env(env=env)
    addr2groups: Dict[str, List[str]] = {}

    for fm_gname, fm_members in fm_groups_dict.items():
        g = str(fm_gname or "").strip()
        if not g:
            continue
        if "-CG_" in g:
            continue
        for fm_member in fm_members:
            fm_member = str(fm_member or "").strip()
            if fm_member in addr_names:
                addr2groups.setdefault(fm_member, []).append(g)

    for k, v in list(addr2groups.items()):
        addr2groups[k] = sorted({str(x or "").strip() for x in (v or []) if str(x or "").strip()})

    out_path = metadata_dir / "fw_address2group.yaml"
    write_yaml_dict(out_path, addr2groups, sort_keys=True)
    return {"ok": True, "env": env, "output_file": str(out_path), "address_total": len(addr_names.keys())}


def build_group_used_in_group_metadata(*, env: str, groups_dir: Path, metadata_dir: Path) -> Dict[str, Any]:
    groups_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)

    group_names: Dict[str, str] = {}
    for p in list_yaml_files(groups_dir):
        doc = read_yaml_dict(p)
        if not isinstance(doc, dict):
            continue
        groups = doc.get("groups")
        if not isinstance(groups, dict):
            continue
        for k in groups.keys():
            name = str(k or "").strip()
            if name:
                group_names[name] = name

    fm_groups_dict = read_fortimgr_groups_for_env(env=env)
    group2groups: Dict[str, List[str]] = {}

    for parent_group, fm_members in fm_groups_dict.items():
        pg = str(parent_group or "").strip()
        if not pg:
            continue
        if "-CG_" in pg:
            continue
        for fm_member in fm_members:
            fm_member = str(fm_member or "").strip()
            if fm_member in group_names:
                group2groups.setdefault(fm_member, []).append(pg)


    for k, v in list(group2groups.items()):
        group2groups[k] = sorted({str(x or "").strip() for x in (v or []) if str(x or "").strip()})

    out_path = metadata_dir / "fw_group2group.yaml"
    write_yaml_dict(out_path, group2groups, sort_keys=True)
    return {"ok": True, "env": env, "output_file": str(out_path), "group_total": len(group_names.keys())}
