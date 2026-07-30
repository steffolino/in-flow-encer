import pytest

from app.application.overlays.parsing import OverlayParseError, parse_csv, parse_geojson
from app.application.overlays.service import OverlayImportService
from app.domain.shared.exceptions import ValidationFailedError
from app.infrastructure.repositories.overlays import OverlayRepository
from app.infrastructure.repositories.tenants import TenantRepository

VALID_CSV = (
    b"latitude,longitude,timestamp,value,label,external_id\n"
    b"47.4210,10.9852,2026-06-20T09:00:00,850,Zugspitze counter,visitor-1\n"
    b"47.4636,10.9986,2026-06-20T09:00:00,430,Eibsee counter,visitor-2\n"
)

MALFORMED_CSV = (
    b"latitude,longitude,timestamp,value\n"
    b"not-a-number,10.9986,2026-06-20T09:00:00,410\n"
    b"47.5867,10.9,2026-06-20T09:00:00,700\n"
)

VALID_GEOJSON = b"""
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [10.9852, 47.4210]},
      "properties": {"value": 1, "external_id": "geo-1", "observed_at": "2026-06-01T00:00:00"}
    }
  ]
}
"""

INVALID_GEOJSON = b'{"type": "NotAFeatureCollection"}'


def test_parse_csv_valid_rows():
    outcome = parse_csv(VALID_CSV)
    assert len(outcome.features) == 2
    assert outcome.row_errors == []


def test_parse_csv_missing_required_column_raises():
    with pytest.raises(OverlayParseError):
        parse_csv(b"latitude,longitude\n47.0,10.0\n")


def test_parse_csv_row_level_errors_are_reported_not_dropped_silently():
    outcome = parse_csv(MALFORMED_CSV)
    assert len(outcome.features) == 1
    assert len(outcome.row_errors) == 1


def test_parse_geojson_valid():
    outcome = parse_geojson(VALID_GEOJSON)
    assert len(outcome.features) == 1
    assert outcome.features[0].geometry.geom_type == "Point"


def test_parse_geojson_rejects_non_feature_collection():
    with pytest.raises(OverlayParseError):
        parse_geojson(INVALID_GEOJSON)


def test_import_csv_creates_layer_and_features(db):
    tenant = TenantRepository(db).create(name="Test", slug="test-csv-overlay")
    service = OverlayImportService(db)
    layer, report = service.import_csv(
        tenant.id, VALID_CSV, name="visitor_counter", measurement_type="visitor_count", unit="people"
    )
    assert report.created == 2
    features = OverlayRepository(db).list_features(tenant.id, layer.id)
    assert len(features) == 2


def test_import_csv_is_idempotent_by_external_id(db):
    tenant = TenantRepository(db).create(name="Test", slug="test-csv-idempotent")
    service = OverlayImportService(db)
    service.import_csv(tenant.id, VALID_CSV, name="visitor_counter", measurement_type="visitor_count", unit=None)
    _layer, second_report = service.import_csv(
        tenant.id, VALID_CSV, name="visitor_counter", measurement_type="visitor_count", unit=None
    )
    assert second_report.created == 0
    assert second_report.duplicates == 2


def test_import_geojson_creates_layer(db):
    tenant = TenantRepository(db).create(name="Test", slug="test-geojson-overlay")
    service = OverlayImportService(db)
    layer, report = service.import_geojson(
        tenant.id, VALID_GEOJSON, name="protected_areas", measurement_type="protected_area", unit=None
    )
    assert report.created == 1
    assert layer.geometry_type == "Point"


def test_import_malformed_geojson_raises_validation_error(db):
    tenant = TenantRepository(db).create(name="Test", slug="test-geojson-malformed")
    service = OverlayImportService(db)
    with pytest.raises(ValidationFailedError):
        service.import_geojson(
            tenant.id, INVALID_GEOJSON, name="broken", measurement_type="protected_area", unit=None
        )
