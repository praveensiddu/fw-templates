"""Render fw-rule templates into env-specific rendered rules."""

import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.exceptions.custom import ValidationError
from backend.services.components_service import _env_letteridentifier
from backend.services.common_service import (
    get_product_generated_repo_name,
    get_product_templates_repo_name,
    get_rendered_folder_prefix,
)
from backend.services.port_protocol_service import PortProtocolService
from backend.services.predef_port_protocol_service import PredefPortProtocolService
from backend.utils.logging_utils import log_all_methods
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import list_yaml_files, read_yaml_dict, write_yaml_dict

logger = logging.getLogger("uvicorn.error")


@log_all_methods()
class RenderService:
    def __init__(self, product: Optional[str] = None):
        self._product = product

    @staticmethod
    def _normalize_env(env: str) -> str:
        v = str(env or "").strip().lower()
        v = re.sub(r"[^a-z0-9_-]", "", v)
        if not v:
            raise ValidationError("env", "is required")
        return v

    def _templates_fw_rules_dir(self) -> Path:
        repo_name = get_product_templates_repo_name(product=str(self._product or ""))
        return get_fwconfigfiles_root(None) / "cloned-repositories" / repo_name / "fw-rules"

    def _rendered_fw_rules_dir(self, env: str) -> Path:
        repo_name = get_product_generated_repo_name(product=str(self._product or ""))
        root = (
            get_fwconfigfiles_root(None)
            / "cloned-repositories"
            / repo_name
            / env
            / get_rendered_folder_prefix()
            / "fw-rules"
        )
        root.mkdir(parents=True, exist_ok=True)
        return root

    def _port_protocol_lookup(self) -> Dict[str, List[str]]:
        """name (lower) -> concrete port values, e.g. 'apiserver6443' -> ['TCP-6443']."""
        out: Dict[str, List[str]] = {}
        for it in PortProtocolService(self._product).list_items():
            name = str(it.get("name") or "").strip().lower()
            pp = (it.get("data") or {}).get("port-protocol")
            port = str((pp if isinstance(pp, dict) else {}).get("port") or "").strip()
            if name and port:
                out[name] = [port]
        for it in PredefPortProtocolService().list_items():
            name = str(it.get("name") or "").strip().lower()
            if not name or name in out:
                continue
            aliases = (it.get("data") or {}).get("aliases")
            vals = [str(a or "").strip() for a in (aliases if isinstance(aliases, list) else [])]
            vals = [v for v in vals if v]
            if vals:
                out[name] = vals
        return out

    @staticmethod
    def _envs_set(v: Any) -> set:
        vals = v if isinstance(v, list) else []
        return {str(x or "").strip().lower() for x in vals if str(x or "").strip()}

    def _filter_endpoint_list(self, v: Any, env: str, letter: str = "") -> List[Dict[str, str]]:
        out: List[Dict[str, str]] = []
        for item in (v if isinstance(v, list) else []):
            if not isinstance(item, dict):
                continue
            group = str(item.get("group") or "").strip()
            if not group:
                continue
            if env not in self._envs_set(item.get("envs")):
                continue
            if letter:
                group = group.replace("<ES>", letter)
            out.append({"group": group})
        return out

    def render(self, *, env: str) -> Dict[str, Any]:
        e = self._normalize_env(env)

        src_root = self._templates_fw_rules_dir()
        if not src_root.exists() or not src_root.is_dir():
            raise ValidationError("fw-rules", f"missing dir '{src_root}'")

        dst_root = self._rendered_fw_rules_dir(e)
        pp_lookup = self._port_protocol_lookup()
        letter = _env_letteridentifier(e)

        files: List[Dict[str, Any]] = []
        warnings: List[str] = []
        for p in list_yaml_files(src_root):
            doc = read_yaml_dict(p)
            rules = doc.get("flowtemplates") if isinstance(doc, dict) else None
            rules = rules if isinstance(rules, list) else []

            rendered: List[Dict[str, Any]] = []
            for rule in rules:
                if not isinstance(rule, dict):
                    continue
                if e not in self._envs_set(rule.get("envs")):
                    continue

                src = self._filter_endpoint_list(rule.get("source-list"), e, letter)
                if not src:
                    continue
                dst = self._filter_endpoint_list(rule.get("destination-list"), e, letter)
                if not dst:
                    continue

                appflowid = str(rule.get("appflowid") or "").strip()
                port_list: List[str] = []
                refs = rule.get("protocol-port-reference")
                for ref in (refs if isinstance(refs, list) else []):
                    key = str(ref or "").strip().lower()
                    if not key:
                        continue
                    vals = pp_lookup.get(key)
                    if vals:
                        for v in vals:
                            if v not in port_list:
                                port_list.append(v)
                    else:
                        warnings.append(f"{p.name}:{appflowid} unknown port-protocol '{ref}'")

                rendered.append(
                    {
                        "name": appflowid,
                        "source-list": src,
                        "destination-list": dst,
                        "protocol-port-list": port_list,
                    }
                )

            write_yaml_dict(dst_root / p.name, rendered, sort_keys=False)
            files.append({"filename": p.name, "rules_in": len(rules), "rules_out": len(rendered)})

        return {
            "ok": True,
            "env": e,
            "output_dir": str(dst_root),
            "files": files,
            "warnings": warnings,
        }
