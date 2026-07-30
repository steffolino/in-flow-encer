"""Generic external-source connector boundary.

A future municipal/sensor/REST API connector implements this Protocol; it is
NOT implemented for arbitrary schema mapping (out of scope, see directive).
Only a local fixture/JSON connector is provided as a concrete example.
"""

from dataclasses import dataclass, field
from typing import Protocol


@dataclass
class ValidationResult:
    is_valid: bool
    errors: list[str] = field(default_factory=list)


@dataclass
class FetchResult:
    records: list[dict]
    next_cursor: str | None = None
    warnings: list[str] = field(default_factory=list)


class ExternalSourceConnector(Protocol):
    async def validate_configuration(self, configuration: dict[str, object]) -> ValidationResult: ...

    async def fetch(
        self, configuration: dict[str, object], cursor: str | None = None
    ) -> FetchResult: ...


class FixtureConnector:
    """Reads canonical records from a local JSON fixture file.

    Configuration schema: {"file_path": str}. This is the only concrete
    connector implemented in the MVP; see docs/extension-guide.md for how to
    add a real REST API connector following the same Protocol.
    """

    async def validate_configuration(self, configuration: dict[str, object]) -> ValidationResult:
        file_path = configuration.get("file_path")
        if not isinstance(file_path, str) or not file_path:
            return ValidationResult(is_valid=False, errors=["configuration.file_path is required"])
        return ValidationResult(is_valid=True)

    async def fetch(
        self, configuration: dict[str, object], cursor: str | None = None
    ) -> FetchResult:
        import json
        from pathlib import Path

        file_path = configuration["file_path"]
        data = json.loads(Path(str(file_path)).read_text(encoding="utf-8"))
        records = data if isinstance(data, list) else data.get("records", [])
        return FetchResult(records=records, next_cursor=None)
