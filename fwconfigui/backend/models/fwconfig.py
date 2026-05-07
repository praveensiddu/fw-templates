"""Pydantic models for fwconfig YAML types."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class YamlFileRef(BaseModel):
    """Reference to a YAML file stored under fwconfigfiles."""

    filename: str


class YamlItem(BaseModel):
    """A single top-level list item from a YAML file, plus its source file."""

    filename: str
    name: Optional[str] = None
    data: Dict[str, Any] = {}


class ListYamlFilesResponse(BaseModel):
    """Response for listing YAML files."""

    type: str
    files: List[YamlFileRef] = []


class ListItemsResponse(BaseModel):
    """Response for listing items merged across files."""

    type: str
    items: List[YamlItem] = []


class SaveItemRequest(BaseModel):
    """Create or update an item in a specific YAML file."""

    filename: str
    name: str
    data: Dict[str, Any] = {}


class DeleteItemRequest(BaseModel):
    """Delete an item from a specific YAML file."""

    filename: str
    name: str
