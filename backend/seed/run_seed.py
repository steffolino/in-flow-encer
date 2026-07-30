"""Seeds the database with synthetic Bavarian Alps sample data.

Run with: `python -m seed.run_seed` from backend/ (inside the backend
container/venv, with APP_DATABASE_URL pointing at a migrated database).
Idempotent: re-running does not create duplicate tenants, places or content.
"""

import json
import uuid
from pathlib import Path

from geoalchemy2.elements import WKTElement
from sqlalchemy import select

from app.application.ingestion.social_content_importer import SocialContentImporter
from app.application.overlays.service import OverlayImportService
from app.db.session import SessionLocal
from app.domain.locations.models import Place
from app.domain.sources.models import SourceType
from app.infrastructure.repositories.sources import SourceRepository
from app.infrastructure.repositories.tenants import TenantRepository
from seed.gazetteer import GAZETTEER

SAMPLE_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "sample-data"

# Each tenant's fixture rows are restricted to its own region's places, so
# switching tenants shows genuinely different, non-overlapping data. Without
# this, one tenant covering "everything" (as an earlier version of this
# script did for Garmisch) looks indistinguishable from a cross-tenant data
# leak even though isolation is enforced correctly at the API/DB layer.
GARMISCH_PLACE_NAMES = ("Zugspitze", "Eibsee", "Garmisch-Partenkirchen", "Tegernsee", "Walchensee", "Herzogstand")
BERCHTESGADEN_PLACE_NAMES = ("Berchtesgaden", "Königssee")
# The fixture's intentionally-unresolved/ambiguous location examples (see
# seed/generate_fixture.py) mention no gazetteer place by name, so they are
# kept only on the primary demo tenant to preserve that demonstration.
AMBIGUOUS_LOCATION_TEXTS = {"Alm", "Berghütte", "Dorfplatz", "Aussichtspunkt", "Wanderweg"}


def _mentions_any(caption: str | None, names: tuple[str, ...]) -> bool:
    return any(name in (caption or "") for name in names)


def _garmisch_filter(row: dict) -> bool:
    if row.get("location_text") in AMBIGUOUS_LOCATION_TEXTS:
        return True
    return _mentions_any(row.get("caption"), GARMISCH_PLACE_NAMES)


def _berchtesgaden_filter(row: dict) -> bool:
    return _mentions_any(row.get("caption"), BERCHTESGADEN_PLACE_NAMES)


TENANT_CONFIGS = [
    {
        "name": "Garmisch-Partenkirchen Tourism",
        "slug": "garmisch-partenkirchen",
        "social_filter": _garmisch_filter,
        "overlays": ["visitor_counter.csv", "parking_occupancy.csv", "protected_areas.geojson"],
    },
    {
        "name": "Berchtesgaden Tourism",
        "slug": "berchtesgaden",
        "social_filter": _berchtesgaden_filter,
        "overlays": ["protected_areas.geojson"],
    },
]

OVERLAY_MEASUREMENT_TYPES = {
    "visitor_counter.csv": ("visitor_count", "people"),
    "parking_occupancy.csv": ("parking_occupancy", "percent"),
    "protected_areas.geojson": ("protected_area", None),
}


def seed_places(db) -> None:
    existing_names = {p.name for p in db.execute(select(Place)).scalars()}
    for place_data in GAZETTEER:
        if place_data["name"] in existing_names:
            continue
        db.add(
            Place(
                id=uuid.uuid4(),
                name=place_data["name"],
                place_type=place_data["place_type"],
                municipality=place_data["municipality"],
                district=place_data["district"],
                region=place_data["region"],
                country=place_data["country"],
                geometry=WKTElement(f"POINT({place_data['lon']} {place_data['lat']})", srid=4326),
                aliases=place_data["aliases"],
            )
        )
    db.flush()


def load_fixture() -> list[dict]:
    path = SAMPLE_DATA_DIR / "social_content_fixture.json"
    return json.loads(path.read_text(encoding="utf-8"))


def seed_tenant(db, config: dict, fixture: list[dict]) -> None:
    tenants = TenantRepository(db)
    tenant = tenants.get_by_slug(config["slug"])
    if tenant is None:
        tenant = tenants.create(name=config["name"], slug=config["slug"])
        db.flush()

    items = fixture
    if config["social_filter"] is not None:
        items = [row for row in fixture if config["social_filter"](row)]

    source = SourceRepository(db).get_or_create(
        tenant.id,
        name="Fixture Social Feed",
        source_type=SourceType.SOCIAL_IMPORT,
        provider="synthetic_fixture",
        description="Synthetic sample social-content data for demo purposes",
    )
    importer = SocialContentImporter(db)
    report = importer.import_rows(tenant.id, source.id, items)
    print(
        f"[{config['slug']}] social-content import: "
        f"received={report.received} created={report.created} updated={report.updated} "
        f"skipped={report.skipped} invalid={report.invalid} duplicates={report.duplicates}"
    )

    overlay_service = OverlayImportService(db)
    for filename in config["overlays"]:
        file_path = SAMPLE_DATA_DIR / filename
        measurement_type, unit = OVERLAY_MEASUREMENT_TYPES[filename]
        body = file_path.read_bytes()
        if filename.endswith(".csv"):
            _layer, report = overlay_service.import_csv(
                tenant.id, body, name=file_path.stem, measurement_type=measurement_type, unit=unit
            )
        else:
            _layer, report = overlay_service.import_geojson(
                tenant.id, body, name=file_path.stem, measurement_type=measurement_type, unit=unit
            )
        print(
            f"[{config['slug']}] overlay import {filename}: "
            f"received={report.received} created={report.created} duplicates={report.duplicates} "
            f"invalid={report.invalid}"
        )


def main() -> None:
    db = SessionLocal()
    try:
        seed_places(db)
        fixture = load_fixture()
        for config in TENANT_CONFIGS:
            seed_tenant(db, config, fixture)
        db.commit()
        print("Seeding complete.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
