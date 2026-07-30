from datetime import datetime, timezone

from app.application.analytics.attention import AttentionAggregator
from app.application.ingestion.social_content_importer import SocialContentImporter
from app.domain.sources.models import SourceType
from app.infrastructure.repositories.places import PlaceRepository
from app.infrastructure.repositories.social_content import SocialContentRepository
from app.infrastructure.repositories.sources import SourceRepository
from app.infrastructure.repositories.tenants import TenantRepository


def _row(external_id, place_hashtag, published_at, reach=1000, engagement=50):
    return {
        "external_id": external_id,
        "platform": "instagram",
        "author_name": f"author-{external_id}",
        "author_category": "tourist",
        "published_at": published_at.isoformat(),
        "caption": None,
        "hashtags": [place_hashtag],
        "estimated_reach": reach,
        "engagement_count": engagement,
    }


def _seed_content(db, tenant_id, source_id):
    importer = SocialContentImporter(db)
    rows = []
    # Zugspitze: 3 posts this period, 1 in previous period (rising).
    for i in range(3):
        rows.append(_row(f"zug-{i}", "zugspitz", datetime(2026, 6, 10 + i, tzinfo=timezone.utc), reach=5000))
    rows.append(_row("zug-prev", "zugspitz", datetime(2026, 5, 15, tzinfo=timezone.utc)))
    # Eibsee: 1 post this period only.
    rows.append(_row("eib-1", "eibsee", datetime(2026, 6, 12, tzinfo=timezone.utc), reach=500, engagement=5))
    importer.import_rows(tenant_id, source_id, rows)


def test_attention_scores_and_time_filtering(db, bavarian_places):
    tenant = TenantRepository(db).create(name="Test", slug="test-attention")
    source = SourceRepository(db).get_or_create(tenant.id, name="Fixture", source_type=SourceType.SOCIAL_IMPORT)
    _seed_content(db, tenant.id, source.id)

    aggregator = AttentionAggregator(SocialContentRepository(db), PlaceRepository(db))
    result = aggregator.compute(
        tenant.id,
        date_from=datetime(2026, 6, 1, tzinfo=timezone.utc),
        date_to=datetime(2026, 6, 30, tzinfo=timezone.utc),
        platform=None,
        region=None,
        source_id=None,
    )

    by_name = {c.place_name: c for c in result.cells}
    assert by_name["Zugspitze"].post_count == 3
    assert by_name["Eibsee"].post_count == 1
    # Zugspitze has more posts and more reach -> should score higher.
    assert by_name["Zugspitze"].attention_score > by_name["Eibsee"].attention_score
    # Zugspitze rose from 1 post (previous period) to 3 posts (this period).
    assert by_name["Zugspitze"].change_vs_previous_period == 200.0


def test_attention_platform_filter_excludes_other_platforms(db, bavarian_places):
    tenant = TenantRepository(db).create(name="Test", slug="test-platform-filter")
    source = SourceRepository(db).get_or_create(tenant.id, name="Fixture", source_type=SourceType.SOCIAL_IMPORT)
    importer = SocialContentImporter(db)
    importer.import_rows(
        tenant.id,
        source.id,
        [
            {
                "external_id": "tiktok-1",
                "platform": "tiktok",
                "published_at": datetime(2026, 6, 5, tzinfo=timezone.utc).isoformat(),
                "hashtags": ["eibsee"],
            }
        ],
    )

    aggregator = AttentionAggregator(SocialContentRepository(db), PlaceRepository(db))
    result = aggregator.compute(
        tenant.id, date_from=None, date_to=None, platform="instagram", region=None, source_id=None
    )
    assert result.cells == []


def test_region_filter_scopes_to_matching_places(db, bavarian_places):
    tenant = TenantRepository(db).create(name="Test", slug="test-region-filter")
    source = SourceRepository(db).get_or_create(tenant.id, name="Fixture", source_type=SourceType.SOCIAL_IMPORT)
    _seed_content(db, tenant.id, source.id)

    aggregator = AttentionAggregator(SocialContentRepository(db), PlaceRepository(db))
    result = aggregator.compute(
        tenant.id, date_from=None, date_to=None, platform=None, region="Oberland", source_id=None
    )
    # Tegernsee (Oberland) has no posts in this test's fixture, so region filter should return nothing.
    assert result.cells == []
