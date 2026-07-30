import uuid

from geoalchemy2 import Geometry
from sqlalchemy import ARRAY, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Place(Base):
    """A gazetteer entry: municipality, lake, mountain, viewpoint or tourism destination.

    Places are shared reference data, not tenant-owned, so multiple tenants can
    match social content against the same Bavarian Alps gazetteer.
    """

    __tablename__ = "places"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    place_type: Mapped[str] = mapped_column(String(50), nullable=False)
    municipality: Mapped[str | None] = mapped_column(String(200))
    district: Mapped[str | None] = mapped_column(String(200))
    region: Mapped[str | None] = mapped_column(String(200))
    country: Mapped[str] = mapped_column(String(2), default="DE")
    geometry: Mapped[str] = mapped_column(Geometry(geometry_type="GEOMETRY", srid=4326), nullable=False)
    aliases: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, server_default="{}")
