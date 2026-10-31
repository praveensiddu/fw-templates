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


class SaveFwRuleRequest(BaseModel):
    filename: Optional[str] = None
    name: str
    original_name: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class DedupePortProtocolRequest(BaseModel):
    duplicate_name: str
    original_name: str


class PortProtocolOverrideRequest(BaseModel):
    name: str
    port: str
    originalservice: str
    newservice: str


class HomeSettings(BaseModel):
    """Home tab tool settings."""
    WORKSPACE: Optional[str] = ""
    TEMPLATES_GITREPO_GROUP: Optional[str] = ""
    RENDERED_GITREPO_GROUP: Optional[str] = ""
    RENDERED_FOLDER_PREFIX: Optional[str] = ""
    INFRA_REPO: Optional[str] = ""
    FWCONFIGFILES: Optional[str] = ""


class SaveHomeSettingsRequest(BaseModel):
    """Request model for saving Home tool settings."""
    settings: HomeSettings
