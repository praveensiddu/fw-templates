"""Pydantic models for fwconfig YAML types."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class YamlFileRef(BaseModel):
    filename: str


class YamlItem(BaseModel):
    filename: str
    name: Optional[str] = None
    data: Dict[str, Any] = {}


class ListYamlFilesResponse(BaseModel):
    type: str
    files: List[YamlFileRef] = []


class ListItemsResponse(BaseModel):
    type: str
    items: List[YamlItem] = []


class SaveItemRequest(BaseModel):
    filename: str
    name: str
    original_name: Optional[str] = None
    data: Dict[str, Any] = {}


class DeleteItemRequest(BaseModel):
    filename: str
    name: str
