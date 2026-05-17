"""Pydantic models for fwconfig YAML types."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class YamlFileRef(BaseModel):
    filename: str


class YamlItem(BaseModel):
    filename: Optional[str] = None
    name: Optional[str] = None
    data: Dict[str, Any] = {}


class ListYamlFilesResponse(BaseModel):
    type: str
    files: List[YamlFileRef] = []


class ListItemsResponse(BaseModel):
    type: str
    items: List[YamlItem] = []


class SaveItemRequest(BaseModel):
    name: str
    original_name: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class UpdateFwRuleFieldsRequest(BaseModel):
    appflowid: str
    protocol_port_reference: Optional[List[str]] = None
    business_purpose_reference: Optional[str] = None
    keywords: Optional[List[str]] = None
    envs: Optional[List[str]] = None


class MoveFwRuleRequest(BaseModel):
    appflowid: str
    from_filename: str
    to_filename: str
