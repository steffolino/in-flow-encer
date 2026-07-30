from datetime import datetime, timezone

from app.application.ingestion.social_content_importer import SocialContentImporter
from app.domain.sources.models import SourceType
from app.infrastructure.repositories.sources import SourceRepository
from app.infrastructure.repositories.tenants import TenantRepository


def _make_source(db, tenant_id):
    return SourceRepository(db).get_or_create(tenant_id, name="Fixture", source_type=SourceType.SOCIAL_IMPORT)


def _row(**overrides):
    row = {
        "external_id": "post-1",
        "platform": "instagram",
        "author_name": "alice",
        "author_category": "tourist",
        "published_at": datetime(2026, 6, 1, tzinfo=timezone.utc).isoformat(),
        "caption": "Great day at Eibsee",
        "hashtags": ["eibsee"],
        "location_text": None,
    }
    row.update(overrides)
    return row


def test_import_creates_new_item(db, bavarian_places):
    tenant = TenantRepository(db).create(name="Test", slug="test-import")
    source = _make_source(db, tenant.id)
    report = SocialContentImporter(db).import_rows(tenant.id, source.id, [_row()])

    assert report.received == 1
    assert report.created == 1
    assert report.duplicates == 0
    assert report.invalid == 0


def test_duplicate_external_id_same_content_is_skipped(db, bavarian_places):
    tenant = TenantRepository(db).create(name="Test", slug="test-dup")
    source = _make_source(db, tenant.id)
    importer = SocialContentImporter(db)

    first = importer.import_rows(tenant.id, source.id, [_row()])
    second = importer.import_rows(tenant.id, source.id, [_row()])

    assert first.created == 1
    assert second.created == 0
    assert second.duplicates == 1


def test_changed_content_for_same_external_id_updates_record(db, bavarian_places):
    tenant = TenantRepository(db).create(name="Test", slug="test-update")
    source = _make_source(db, tenant.id)
    importer = SocialContentImporter(db)

    importer.import_rows(tenant.id, source.id, [_row(engagement_count=10)])
    second = importer.import_rows(tenant.id, source.id, [_row(engagement_count=999)])

    assert second.created == 0
    assert second.updated == 1
    assert second.duplicates == 0


def test_duplicate_within_same_batch_is_deduplicated(db, bavarian_places):
    tenant = TenantRepository(db).create(name="Test", slug="test-batch-dup")
    source = _make_source(db, tenant.id)
    report = SocialContentImporter(db).import_rows(tenant.id, source.id, [_row(), _row()])

    assert report.received == 2
    assert report.created == 1
    assert report.duplicates == 1


def test_invalid_row_is_reported_not_silently_dropped(db, bavarian_places):
    tenant = TenantRepository(db).create(name="Test", slug="test-invalid")
    source = _make_source(db, tenant.id)
    bad_row = _row(external_id="post-bad", platform="")  # blank platform fails validation
    report = SocialContentImporter(db).import_rows(tenant.id, source.id, [bad_row])

    assert report.invalid == 1
    assert report.created == 0
    assert len(report.warnings) == 1
    assert "Row 0" in report.warnings[0].message


def test_ambiguous_location_produces_no_matches_but_item_is_still_created(db, bavarian_places):
    tenant = TenantRepository(db).create(name="Test", slug="test-ambiguous")
    source = _make_source(db, tenant.id)
    row = _row(external_id="post-ambiguous", caption=None, hashtags=[], location_text="Berghütte")
    importer = SocialContentImporter(db)
    report = importer.import_rows(tenant.id, source.id, [row])

    assert report.created == 1

    from app.infrastructure.repositories.social_content import SocialContentRepository

    items = SocialContentRepository(db).list_for_tenant(tenant.id)
    assert len(items) == 1
    assert items[0].location_matches == []
