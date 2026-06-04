import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.exceptions.custom import ValidationError
from backend.services.common_service import get_product_templates_repo_name
from backend.utils.logging_utils import log_all_methods
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import list_yaml_files, read_yaml_dict, write_yaml_dict

_COMPONENTS_FILENAME = "components.yaml"
_ALLOWED_SITE_ENVS = {"prd", "pac", "rtb", "ent", "dev"}


@log_all_methods()
class ComponentsService:
    def __init__(self, product: Optional[str] = None):
        self._product = product

    def _repo_root(self) -> Path:
        if not str(self._product or "").strip():
            return get_fwconfigfiles_root(None)
        repo_name = get_product_templates_repo_name(product=str(self._product or ""))
        return get_fwconfigfiles_root(None) / "cloned-repositories" / repo_name

    def _path(self) -> Path:
        return self._repo_root() / _COMPONENTS_FILENAME

    @staticmethod
    def _normalize_component_name(name: str) -> str:
        v = str(name or "").strip()
        v = re.sub(r"[^A-Za-z0-9_-]", "", v)
        if not v:
            raise ValidationError("name", "is required")
        return v

    @staticmethod
    def _normalize_networkarea(v: Any) -> str:
        x = str(v or "").strip().upper()
        x = re.sub(r"[^A-Z0-9_-]", "", x)
        return x

    @staticmethod
    def _normalize_description(v: Any) -> str:
        return str(v or "").strip()

    @staticmethod
    def _normalize_exposedto(v: Any) -> List[str]:
        if isinstance(v, list):
            parts = [str(x or "").strip() for x in v]
        else:
            parts = [p.strip() for p in str(v or "").split(",")]
        out = [p for p in parts if p]
        return sorted(list(dict.fromkeys(out)))

    @staticmethod
    def _normalize_sites(v: Any) -> Dict[str, List[str]]:
        raw = v if isinstance(v, dict) else {}
        out: Dict[str, List[str]] = {}
        for env, sites in raw.items():
            env_key = str(env or "").strip().lower()
            if env_key not in _ALLOWED_SITE_ENVS:
                continue

            lst = sites if isinstance(sites, list) else []
            norm_sites: List[str] = []
            for s in lst:
                sn = str(s or "").strip().upper()
                sn = re.sub(r"[^A-Z0-9_-]", "", sn)
                if sn:
                    norm_sites.append(sn)

            uniq = sorted(list(dict.fromkeys(norm_sites)))
            if uniq:
                out[env_key] = uniq

        return out

    def list_items(self) -> List[Dict[str, Any]]:
        path = self._path()
        if not path.exists():
            return []

        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        items: List[Dict[str, Any]] = []
        for k in sorted([str(x) for x in raw.keys()]):
            val = raw.get(k)
            data = val if isinstance(val, dict) else {}
            items.append(
                {
                    "name": k,
                    "data": {
                        "name": k,
                        "networkarea": str(data.get("networkarea", "") or "").strip(),
                        "description": str(data.get("description", "") or "").strip(),
                        "exposedto": data.get("exposedto") if isinstance(data.get("exposedto"), list) else [],
                        "sites": data.get("sites") if isinstance(data.get("sites"), dict) else {},
                    },
                }
            )

        return items

    def save_item(self, *, name: str, data: Dict[str, Any], original_name: Optional[str] = None) -> None:
        key = self._normalize_component_name(name)
        prev = self._normalize_component_name(original_name) if original_name is not None else ""

        payload = dict(data or {})
        networkarea = self._normalize_networkarea(payload.get("networkarea"))
        description = self._normalize_description(payload.get("description"))
        exposedto = self._normalize_exposedto(payload.get("exposedto"))
        sites = self._normalize_sites(payload.get("sites"))

        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        if prev and prev != key:
            existing_keys = {self._normalize_component_name(k) for k in raw.keys()}
            if prev not in existing_keys:
                raise ValidationError("original_name", "does not exist")

            fw_rules_root = self._repo_root() / "fw-rules"
            fw_rules_root.mkdir(parents=True, exist_ok=True)

            def _rewrite_group(group: Any) -> str:
                g = str(group or "").strip()
                if not g or "-" not in g:
                    return g
                parts = g.split("-", 2)
                if len(parts) < 3:
                    return g
                site, comp, rest = parts[0], parts[1], parts[2]
                comp_norm = self._normalize_component_name(comp) if str(comp or "").strip() else ""
                if comp_norm and comp_norm == prev:
                    return f"{site}-{key}-{rest}"
                return g

            for fpath in list_yaml_files(fw_rules_root):
                doc = read_yaml_dict(fpath)
                if not isinstance(doc, dict):
                    continue
                flowtemplates = doc.get("flowtemplates")
                if not isinstance(flowtemplates, list):
                    continue

                file_changed = False
                for entry in flowtemplates:
                    if not isinstance(entry, dict):
                        continue

                    for fld in ("source-list", "destination-list"):
                        lst = entry.get(fld)
                        if not isinstance(lst, list):
                            continue

                        changed_here = False
                        for it in lst:
                            if not isinstance(it, dict):
                                continue
                            before = it.get("group")
                            after = _rewrite_group(before)
                            if after != str(before or ""):
                                it["group"] = after
                                changed_here = True

                        if changed_here:
                            file_changed = True

                if file_changed:
                    write_yaml_dict(fpath, doc, sort_keys=True)

            raw.pop(prev, None)

        raw[key] = {
            "networkarea": networkarea,
            "description": description,
            "exposedto": exposedto,
            "sites": sites,
        }
        write_yaml_dict(path, raw, sort_keys=True)

    def delete_item(self, *, name: str) -> None:
        key = self._normalize_component_name(name)
        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        raw.pop(key, None)
        write_yaml_dict(path, raw, sort_keys=True)
