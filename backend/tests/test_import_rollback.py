import pytest

from app.application.overlays.service import OverlayImportService
from app.domain.shared.exceptions import ValidationFailedError
from app.infrastructure.repositories.overlays import OverlayRepository
from app.infrastructure.repositories.tenants import TenantRepository


def test_malformed_csv_import_creates_no_layer(db):
    """A file-level parse failure must not leave a half-created layer/source
    behind: validation happens before any persistence is attempted."""
    tenant = TenantRepository(db).create(name="Test", slug="rollback-csv-tenant")
    service = OverlayImportService(db)

    with pytest.raises(ValidationFailedError):
        service.import_csv(
            tenant.id, b"not,the,right,columns\n1,2,3,4\n", name="broken", measurement_type="x", unit=None
        )

    layers = OverlayRepository(db).list_for_tenant(tenant.id)
    assert layers == []


def test_malformed_geojson_import_creates_no_layer(db):
    tenant = TenantRepository(db).create(name="Test", slug="rollback-geojson-tenant")
    service = OverlayImportService(db)

    with pytest.raises(ValidationFailedError):
        service.import_geojson(
            tenant.id, b'{"type": "NotAFeatureCollection"}', name="broken", measurement_type="x", unit=None
        )

    layers = OverlayRepository(db).list_for_tenant(tenant.id)
    assert layers == []


def test_api_level_malformed_upload_does_not_commit_layer(client, db):
    tenant = TenantRepository(db).create(name="Test", slug="rollback-api-tenant")
    db.commit()

    resp = client.post(
        "/api/v1/overlays/import/csv",
        headers={"X-Tenant-Slug": tenant.slug},
        data={"name": "broken", "measurement_type": "x"},
        files={"file": ("broken.csv", b"not,the,right,columns\n1,2,3,4\n", "text/csv")},
    )
    assert resp.status_code == 422

    resp_layers = client.get("/api/v1/overlays", headers={"X-Tenant-Slug": tenant.slug})
    assert resp_layers.json() == []
