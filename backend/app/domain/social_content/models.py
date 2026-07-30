import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    ARRAY,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class LocationMatchMethod(str, enum.Enum):
    EXPLICIT_COORDINATES = "explicit_coordinates"
    LOCATION_FIELD = "location_field"
    EXACT_PLACE_NAME = "exact_place_name"
    HASHTAG = "hashtag"
    ALIAS = "alias"
    MANUAL = "manual"
    CUSTOMER_AI = "customer_ai"


class SocialContentItem(Base):
    """A single imported social-content record, normalised into the canonical model."""

    __tablename__ = "social_content_items"
    __table_args__ = (
        UniqueConstraint("tenant_id", "source_id", "content_hash", name="uq_social_content_dedup"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    external_id: Mapped[str | None] = mapped_column(String(300))
    platform: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    author_name: Mapped[str | None] = mapped_column(String(200))
    author_category: Mapped[str | None] = mapped_column(String(100))
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    caption: Mapped[str | None] = mapped_column(Text)
    hashtags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, server_default="{}")
    content_url: Mapped[str | None] = mapped_column(String(500))
    engagement_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    estimated_reach: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    location_text: Mapped[str | None] = mapped_column(String(300))
    explicit_lat: Mapped[float | None] = mapped_column(Float)
    explicit_lon: Mapped[float | None] = mapped_column(Float)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    raw_metadata: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    location_matches: Mapped[list["LocationMatch"]] = relationship(
        back_populates="social_content_item", cascade="all, delete-orphan"
    )


class LocationMatch(Base):
    """A deterministic match between a social-content item and a gazetteer place."""

    __tablename__ = "location_matches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    social_content_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("social_content_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    place_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("places.id", ondelete="CASCADE"), nullable=False, index=True
    )
    method: Mapped[LocationMatchMethod] = mapped_column(String(30), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    matched_text: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    social_content_item: Mapped["SocialContentItem"] = relationship(back_populates="location_matches")
