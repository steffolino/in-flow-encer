"""Shared import-report shape used by both social-content and overlay imports."""

from pydantic import BaseModel, Field


class ImportWarning(BaseModel):
    row: int | None = None
    message: str


class ImportReport(BaseModel):
    received: int = 0
    created: int = 0
    updated: int = 0
    skipped: int = 0
    invalid: int = 0
    duplicates: int = 0
    warnings: list[ImportWarning] = Field(default_factory=list)
