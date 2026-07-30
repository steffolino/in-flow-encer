from app.infrastructure.repositories.tenants import TenantRepository


def test_not_found_error_has_consistent_error_envelope(client, db):
    tenant = TenantRepository(db).create(name="Test", slug="error-format-tenant")
    db.commit()
    resp = client.get(
        "/api/v1/overlays/00000000-0000-0000-0000-000000000000/features",
        headers={"X-Tenant-Slug": tenant.slug},
    )
    assert resp.status_code == 404
    body = resp.json()
    assert body["error"]["code"] == "not_found"
    assert "message" in body["error"]


def test_validation_error_returns_422_with_details(client, db):
    tenant = TenantRepository(db).create(name="Test", slug="validation-tenant")
    db.commit()
    resp = client.post(
        "/api/v1/overlays/import/csv",
        headers={"X-Tenant-Slug": tenant.slug},
        data={"name": "bad", "measurement_type": "test"},
        files={"file": ("bad.csv", b"latitude,longitude\n1,2\n", "text/csv")},
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "validation_failed"


def test_disallowed_file_extension_is_rejected(client, db):
    tenant = TenantRepository(db).create(name="Test", slug="ext-tenant")
    db.commit()
    resp = client.post(
        "/api/v1/overlays/import/csv",
        headers={"X-Tenant-Slug": tenant.slug},
        data={"name": "bad", "measurement_type": "test"},
        files={"file": ("bad.exe", b"not a csv", "application/octet-stream")},
    )
    assert resp.status_code == 422


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
