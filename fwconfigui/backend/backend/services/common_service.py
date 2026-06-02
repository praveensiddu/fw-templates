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
                existing = fm_groups_dict.get(g)
                if isinstance(existing, list) and existing:
                    fm_groups_dict[g] = sorted(set(existing).union(members))
                else:
                    fm_groups_dict[g] = sorted(set(members))

    return fm_groups_dict


def read_fortimgr_rules_dict(fm_rules_dir: Path) -> Dict[str, Dict[str, List[str]]]:
    fm_rules_dict: Dict[str, Dict[str, List[str]]] = {}
    if not fm_rules_dir.exists() or not fm_rules_dir.is_dir():
        return fm_rules_dict

    for p in list_yaml_files_recursive(fm_rules_dir):
        doc = read_yaml_dict(p)
        if not isinstance(doc, dict):
            continue

        for rule_name, rule_raw in doc.items():
            r = str(rule_name or "").strip()
            if not r:
                continue
            if not isinstance(rule_raw, dict):
                continue

            src_vals_raw = rule_raw.get("srcaddr")
            if isinstance(src_vals_raw, list):
                srcaddr = [str(x or "").strip() for x in src_vals_raw]
                srcaddr = [x for x in srcaddr if x]
            else:
                srcaddr = []

            dst_vals_raw = rule_raw.get("dstaddr")
            if isinstance(dst_vals_raw, list):
                dstaddr = [str(x or "").strip() for x in dst_vals_raw]
                dstaddr = [x for x in dstaddr if x]
            else:
                dstaddr = []

            dest_vals_raw = rule_raw.get("destaddr")
            if isinstance(dest_vals_raw, list):
                destaddr = [str(x or "").strip() for x in dest_vals_raw]
                destaddr = [x for x in destaddr if x]
            else:
                destaddr = []

            service_vals_raw = rule_raw.get("service")
            if isinstance(service_vals_raw, list):
                service = [str(x or "").strip() for x in service_vals_raw]
                service = [x for x in service if x]
            else:
                service = []

            if srcaddr or dstaddr or destaddr or service:
                fm_rules_dict[r] = {
                    "srcaddr": srcaddr,
                    "dstaddr": dstaddr,
                    "destaddr": destaddr,
                    "service": service,
                }

    return fm_rules_dict


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

def read_fortimgr_rules_for_env(*, env: str) -> Dict[str, Dict[str, List[str]]]:
    fm_root_raw = str(os.getenv("FORTIMGR_EXTRACT_REPO", "") or "").strip()
    if not fm_root_raw:
        raise ValidationError("FORTIMGR_EXTRACT_REPO", "env var is required")

    fm_root = Path(fm_root_raw).expanduser()
    fm_rules_dir = fm_root / env / "flows"
    return read_fortimgr_rules_dict(fm_rules_dir)

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


def read_existing_group_names(*, groups_dir: Path, excluded_filenames: set[str] | None = None) -> Dict[str, Any]:
    existing_group_names: set[str] = set()
    name_override_to_key: Dict[str, str] = {}

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

        for k, v in groups.items():
            name = str(k or "").strip()
            if not name:
                continue
            existing_group_names.add(name)

            data = v if isinstance(v, dict) else {}
            raw_no = data.get("name-override")
            if isinstance(raw_no, list):
                overrides = [str(x or "").strip() for x in raw_no]
                overrides = [x for x in overrides if x]
            else:
                overrides = []
            for no in overrides:
                name_override_to_key[no] = name

    return {
        "names": existing_group_names,
        "name_override_to_key": name_override_to_key,
    }


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


def read_address_names(*, address_dir: Path, include_name_override: bool = False) -> Dict[str, str]:
    addr_names: Dict[str, str] = {}
    for p in list_yaml_files(address_dir):
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

            addr_names[name] = name

            if include_name_override:
                data = v if isinstance(v, dict) else {}
                raw_no = data.get("name-override")
                if isinstance(raw_no, list):
                    overrides = [str(x or "").strip() for x in raw_no]
                    overrides = [x for x in overrides if x]
                else:
                    overrides = []

                for no in overrides:
                    addr_names[no] = name
    return addr_names


def read_group_names(*, groups_dir: Path, include_name_override: bool = False) -> Dict[str, str]:
    group_names: Dict[str, str] = {}
    for p in list_yaml_files(groups_dir):
        doc = read_yaml_dict(p)
        if not isinstance(doc, dict):
            continue
        groups = doc.get("groups")
        if not isinstance(groups, dict):
            continue
        for k, v in groups.items():
            name = str(k or "").strip()
            if not name:
                continue

            group_names[name] = name

            if include_name_override:
                data = v if isinstance(v, dict) else {}
                raw_no = data.get("name-override")
                if isinstance(raw_no, list):
                    overrides = [str(x or "").strip() for x in raw_no]
                    overrides = [x for x in overrides if x]
                else:
                    overrides = []

                for no in overrides:
                    group_names[no] = name
    return group_names


def build_member_used_in_group_metadata(*, fm_groups_dict: Dict[str, List[str]], member_names: Dict[str, str]) -> Dict[str, List[str]]:
    member2groups: Dict[str, List[str]] = {}

    for fm_gname, fm_members in fm_groups_dict.items():
        g = str(fm_gname or "").strip()
        if not g:
            continue
        if "-CG_" in g:
            continue
        for fm_member in fm_members:
            m = str(fm_member or "").strip()
            if not m:
                continue
            if m in member_names:
                member2groups.setdefault(member_names[m], []).append(g)

    for k, v in list(member2groups.items()):
        member2groups[k] = sorted({str(x or "").strip() for x in (v or []) if str(x or "").strip()})

    return member2groups


def build_member_used_in_rule_metadata(
    *,
    fm_rules_dict: Dict[str, Dict[str, List[str]]],
    member_names: Dict[str, str],
) -> Dict[str, List[str]]:
    member2rules: Dict[str, List[str]] = {}

    for rule_id, rule_data in fm_rules_dict.items():
        if not isinstance(rule_data, dict):
            continue

        src = rule_data.get("srcaddr")
        if not isinstance(src, list):
            src = []
        dst = rule_data.get("dstaddr")
        if not isinstance(dst, list):
            dst = []
        dest = rule_data.get("destaddr")
        if not isinstance(dest, list):
            dest = []

        for member in list(src) + list(dst) + list(dest):
            m = str(member or "").strip()
            if not m:
                continue
            if m not in member_names:
                continue
            # must use member_names[m] as key so that the nameoverride name is converted to original name
            member2rules.setdefault(member_names[m], []).append(str(rule_id))

    for k, v in list(member2rules.items()):
        member2rules[k] = sorted({str(x or "").strip() for x in (v or []) if str(x or "").strip()})

    return member2rules


def build_address_used_in_rule_metadata(*, env: str, address_dir: Path, metadata_dir: Path) -> Dict[str, Any]:
    address_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)

    addr_names = read_address_names(address_dir=address_dir, include_name_override=True)
    fm_rules_dict = read_fortimgr_rules_for_env(env=env)
    addr2rule = build_member_used_in_rule_metadata(fm_rules_dict=fm_rules_dict, member_names=addr_names)

    out_path = metadata_dir / "fw_address2rule.yaml"
    write_yaml_dict(out_path, addr2rule, sort_keys=True)
    return {"ok": True, "env": env, "output_file": str(out_path), "address_total": len(addr_names.keys())}

def cleanup_address_not_used_by_product(*, address_dir: Path, groups_dir: Path, metadata_dir: Path) -> Dict[str, Any]:
    address_dir.mkdir(parents=True, exist_ok=True)
    groups_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)

    extract_addr_path = address_dir / "fm_extract_address.yaml"
    raw_any = read_yaml_dict(extract_addr_path) if extract_addr_path.exists() else {}
    raw = raw_any if isinstance(raw_any, dict) else {}
    addresses_any = raw.get("addresses")
    addresses = dict(addresses_any) if isinstance(addresses_any, dict) else {}

    addr2rules_path = metadata_dir / "fw_address2rule.yaml"
    addr2rules_any = read_yaml_dict(addr2rules_path) if addr2rules_path.exists() else {}
    addr2rules = addr2rules_any if isinstance(addr2rules_any, dict) else {}
    used_in_rules_lc = {str(k or "").strip().lower() for k in addr2rules.keys() if str(k or "").strip()}

    extract_groups_path = groups_dir / "fm_extract_groups.yaml"
    groups_raw_any = read_yaml_dict(extract_groups_path) if extract_groups_path.exists() else {}
    groups_raw = groups_raw_any if isinstance(groups_raw_any, dict) else {}
    groups_any = groups_raw.get("groups")
    groups = groups_any if isinstance(groups_any, dict) else {}

    used_in_groups_lc: set[str] = set()
    for _, gdata_any in groups.items():
        gdata = gdata_any if isinstance(gdata_any, dict) else {}
        members_any = gdata.get("members")
        members = members_any if isinstance(members_any, list) else []
        for m in members:
            s = str(m or "").strip()
            if s:
                used_in_groups_lc.add(s.lower())

    kept: Dict[str, Any] = {}
    removed_total = 0

    for name, data in addresses.items():
        n = str(name or "").strip()
        if not n:
            continue
        n_lc = n.lower()

        if n_lc in used_in_rules_lc:
            kept[n] = data
            continue

        if n_lc not in used_in_groups_lc:
            removed_total += 1
            continue

        kept[n] = data

    write_yaml_dict(extract_addr_path, {"addresses": kept}, sort_keys=True)
    return {
        "ok": True,
        "output_file": str(extract_addr_path),
        "before_total": len(addresses.keys()),
        "after_total": len(kept.keys()),
        "removed_total": removed_total,
    }

def build_address_used_in_group_metadata(*, env: str, address_dir: Path, metadata_dir: Path) -> Dict[str, Any]:
    address_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)

    addr_names = read_address_names(address_dir=address_dir, include_name_override=True)

    fm_groups_dict = read_fortimgr_groups_for_env(env=env)
    addr2groups = build_member_used_in_group_metadata(fm_groups_dict=fm_groups_dict, member_names=addr_names)

    out_path = metadata_dir / "fw_address2group.yaml"
    write_yaml_dict(out_path, addr2groups, sort_keys=True)
    return {"ok": True, "env": env, "output_file": str(out_path), "address_total": len(addr_names.keys())}


def build_group_used_in_group_metadata(*, env: str, groups_dir: Path, metadata_dir: Path) -> Dict[str, Any]:
    groups_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)

    group_names = read_group_names(groups_dir=groups_dir, include_name_override=True)

    fm_groups_dict = read_fortimgr_groups_for_env(env=env)
    group2groups = build_member_used_in_group_metadata(fm_groups_dict=fm_groups_dict, member_names=group_names)

    out_path = metadata_dir / "fw_group2group.yaml"
    write_yaml_dict(out_path, group2groups, sort_keys=True)
    return {"ok": True, "env": env, "output_file": str(out_path), "group_total": len(group_names.keys())}


def build_group_used_in_rule_metadata(*, env: str, groups_dir: Path, metadata_dir: Path) -> Dict[str, Any]:
    groups_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)

    group_names = read_group_names(groups_dir=groups_dir, include_name_override=True)

    fm_rules_dict = read_fortimgr_rules_for_env(env=env)
    group2rules = build_member_used_in_rule_metadata(fm_rules_dict=fm_rules_dict, member_names=group_names)

    out_path = metadata_dir / "fw_group2rule.yaml"
    write_yaml_dict(out_path, group2rules, sort_keys=True)
    return {"ok": True, "env": env, "output_file": str(out_path), "group_total": len(group_names.keys())}