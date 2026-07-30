from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.schemas import PlaceOut
from app.db.session import get_db
from app.infrastructure.repositories.places import PlaceRepository

router = APIRouter(prefix="/places", tags=["places"])


@router.get("", response_model=list[PlaceOut])
def list_places(db: Session = Depends(get_db)) -> list[PlaceOut]:
    repo = PlaceRepository(db)
    places = repo.list_all()
    result = []
    for place in places:
        lon, lat = repo.centroid_lon_lat(place)
        result.append(
            PlaceOut(
                id=place.id,
                name=place.name,
                place_type=place.place_type,
                municipality=place.municipality,
                district=place.district,
                region=place.region,
                country=place.country,
                aliases=place.aliases,
                lon=lon,
                lat=lat,
            )
        )
    return result
