"""Application settings."""

from pydantic import BaseModel


class Settings(BaseModel):
    """Runtime settings."""

    api_title: str = "FW Config UI"
    api_version: str = "0.1.0"
    host: str = "0.0.0.0"
    port: int = 8000


settings = Settings()
