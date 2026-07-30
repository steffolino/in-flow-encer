"""Canonical ingestion DTOs.

Any platform-specific adapter (fixture importer, a future Instagram/YouTube
connector, etc.) must convert its payload into `CanonicalSocialContentInput`
before it reaches the domain/application layer. See docs/adr for the ADR on
this boundary and docs/extension-guide.md for how to add a new adapter.
"""

from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.application.shared.import_report import ImportReport, ImportWarning

__all__ = ["CanonicalSocialContentInput", "ImportReport", "ImportWarning"]


class CanonicalSocialContentInput(BaseModel):
    external_id: str | None = None
    platform: str
    author_name: str | None = None
    author_category: str | None = None
    published_at: datetime
    caption: str | None = None
    hashtags: list[str] = Field(default_factory=list)
    content_url: str | None = None
    engagement_count: int = 0
    estimated_reach: int = 0
    location_text: str | None = None
    explicit_lat: float | None = None
    explicit_lon: float | None = None
    raw_metadata: dict = Field(default_factory=dict)

    @field_validator("platform")
    @classmethod
    def platform_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("platform must not be blank")
        return value.strip().lower()

    @field_validator("explicit_lat")
    @classmethod
    def lat_in_range(cls, value: float | None) -> float | None:
        if value is not None and not (-90.0 <= value <= 90.0):
            raise ValueError("explicit_lat must be between -90 and 90")
        return value

    @field_validator("explicit_lon")
    @classmethod
    def lon_in_range(cls, value: float | None) -> float | None:
        if value is not None and not (-180.0 <= value <= 180.0):
            raise ValueError("explicit_lon must be between -180 and 180")
        return value
