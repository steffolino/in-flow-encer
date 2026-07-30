import uuid

from geoalchemy2.shape import to_shape
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.locations.models import Place


class PlaceRepository:
    """Read access to the shared (non-tenant-owned) place gazetteer."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def list_all(self) -> list[Place]:
        return list(self._db.execute(select(Place).order_by(Place.name)).scalars())

    def get_by_id(self, place_id: uuid.UUID) -> Place | None:
        return self._db.get(Place, place_id)

    def find_by_exact_name(self, normalised_name: str) -> list[Place]:
        """Return every place whose normalised name matches exactly (case-insensitive)."""
        places = self.list_all()
        return [p for p in places if p.name.strip().casefold() == normalised_name]

    def find_by_alias(self, normalised_alias: str) -> list[Place]:
        places = self.list_all()
        return [p for p in places if normalised_alias in {a.strip().casefold() for a in p.aliases}]

    @staticmethod
    def centroid_lon_lat(place: Place) -> tuple[float, float]:
        shape = to_shape(place.geometry)
        centroid = shape.centroid
        return centroid.x, centroid.y
