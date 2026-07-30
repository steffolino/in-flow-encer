import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SourceType(str, enum.Enum):
    SOCIAL_IMPORT = "social_import"
    CSV_OVERLAY = "csv_overlay"
    GEOJSON_OVERLAY = "geojson_overlay"
    REST_API = "rest_api"
    SYSTEM_FIXTURE = "system_fixture"


class Source(Base):
    """Describes where an imported dataset originated (provenance metadata)."""

    __tablename__ = "sources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    source_type: Mapped[SourceType] = mapped_column(String(30), nullable=False)
    provider: Mapped[str | None] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    source_url: Mapped[str | None] = mapped_column(String(500))
    last_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
