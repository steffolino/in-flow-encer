from datetime import datetime, timezone

from app.application.ingestion.social_content_importer import SocialContentImporter
from app.application.overlays.service import OverlayImportService
from app.domain.sources.models import SourceType
from app.infrastructure.repositories.sources import SourceRepository
from app.infrastructure.repositories.tenants import TenantRepository


def test_social_content_list_is_scoped_to_authenticated_tenant(client, db, bavarian_places):
    tenant_a = TenantRepository(db).create(name="Tenant A", slug="tenant-a")
    tenant_b = TenantRepository(db).create(name="Tenant B", slug="tenant-b")
    source_a = SourceRepository(db).get_or_create(tenant_a.id, name="Fixture", source_type=SourceType.SOCIAL_IMPORT)
    SocialContentImporter(db).import_rows(
        tenant_a.id,
        source_a.id,
        [
            {
                "external_id": "secret-post",
                "platform": "instagram",
                "published_at": datetime(2026, 6, 1, tzinfo=timezone.utc).isoformat(),
                "caption": "Tenant A private content",
                "hashtags": ["eibsee"],
            }
        ],
    )
    db.commit()

    resp_b = client.get("/api/v1/social-content", headers={"X-Tenant-Slug": tenant_b.slug})
    assert resp_b.status_code == 200
    assert resp_b.json()["items"] == []

    resp_a = client.get("/api/v1/social-content", headers={"X-Tenant-Slug": tenant_a.slug})
    assert resp_a.status_code == 200
    assert len(resp_a.json()["items"]) == 1


def test_overlay_cross_tenant_access_returns_not_found(client, db):
    tenant_a = TenantRepository(db).create(name="Tenant A", slug="overlay-tenant-a")
    tenant_b = TenantRepository(db).create(name="Tenant B", slug="overlay-tenant-b")
    layer, _report = OverlayImportService(db).import_csv(
        tenant_a.id,
        b"latitude,longitude,timestamp,value\n47.42,10.98,2026-06-20T09:00:00,850\n",
        name="counter",
        measurement_type="visitor_count",
        unit=None,
    )
    db.commit()

    resp = client.get(f"/api/v1/overlays/{layer.id}/features", headers={"X-Tenant-Slug": tenant_b.slug})
    assert resp.status_code == 404

    resp_delete = client.delete(f"/api/v1/overlays/{layer.id}", headers={"X-Tenant-Slug": tenant_b.slug})
    assert resp_delete.status_code == 404

    resp_own = client.get(f"/api/v1/overlays/{layer.id}/features", headers={"X-Tenant-Slug": tenant_a.slug})
    assert resp_own.status_code == 200


def test_missing_tenant_header_is_rejected(client):
    resp = client.get("/api/v1/social-content")
    assert resp.status_code == 401


def test_unknown_tenant_slug_is_forbidden(client):
    resp = client.get("/api/v1/social-content", headers={"X-Tenant-Slug": "does-not-exist"})
    assert resp.status_code == 403


def test_tenant_id_cannot_be_injected_via_request_body(client, db):
    """The import endpoint has no tenant_id field at all; the tenant is always
    resolved from the trusted header, so a client cannot claim another
    tenant's identity via the request body."""
    tenant_a = TenantRepository(db).create(name="Tenant A", slug="inject-tenant-a")
    db.commit()

    resp = client.post(
        "/api/v1/social-content/import",
        headers={"X-Tenant-Slug": tenant_a.slug},
        json={"source_name": "Test Source", "items": []},
    )
    assert resp.status_code == 200
    assert "tenant_id" not in resp.json()
