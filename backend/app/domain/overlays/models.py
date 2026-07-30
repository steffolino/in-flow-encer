import enum
import uuid
from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class GeometryType(str, enum.Enum):
    POINT = "Point"
    LINESTRING = "LineString"
    POLYGON = "Polygon"
    MULTIPOINT = "MultiPoint"
    MULTILINESTRING = "MultiLineString"
    MULTIPOLYGON = "MultiPolygon"


class OverlayLayer(Base):
    """A customer-supplied external data layer (e.g. visitor counters, parking occupancy)."""

    __tablename__ = "overlay_layers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000))
    geometry_type: Mapped[str] = mapped_column(String(30), nullable=False)
    measurement_type: Mapped[str] = mapped_column(String(100), nullable=False)
    unit: Mapped[str | None] = mapped_column(String(50))
    visibility: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    style_configuration: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    time_field: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    features: Mapped[list["OverlayFeature"]] = relationship(
        back_populates="layer", cascade="all, delete-orphan"
    )


class OverlayFeature(Base):
    """A single geographic feature belonging to an overlay layer."""

    __tablename__ = "overlay_features"
    __table_args__ = (
        UniqueConstraint("tenant_id", "layer_id", "content_hash", name="uq_overlay_feature_dedup"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    layer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("overlay_layers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    geometry: Mapped[str] = mapped_column(Geometry(geometry_type="GEOMETRY", srid=4326), nullable=False)
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    value: Mapped[float | None] = mapped_column(Float)
    properties: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    external_id: Mapped[str | None] = mapped_column(String(300))
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    layer: Mapped["OverlayLayer"] = relationship(back_populates="features")
