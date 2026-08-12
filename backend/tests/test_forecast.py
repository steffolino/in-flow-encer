from datetime import datetime, timezone

from app.application.analytics.forecast import ForecastService
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


def test_forecast_projects_rising_trend_with_high_confidence(db, bavarian_places):
    tenant = TenantRepository(db).create(name="Test", slug="test-forecast-rising")
    source = SourceRepository(db).get_or_create(tenant.id, name="Fixture", source_type=SourceType.SOCIAL_IMPORT)
    importer = SocialContentImporter(db)

    rows = []
    # Zugspitze: 12 posts this period (>= high-confidence threshold), 4 in the
    # previous period -> +200% trend, so the forecast should rise further.
    # AttentionAggregator's date bounds are inclusive on both ends and the
    # previous-period window is [date_from - duration, date_from], so a post
    # dated exactly date_from (Jun 1) would double-count into both periods -
    # current posts start Jun 2 to avoid landing on that shared boundary.
    for i in range(12):
        rows.append(_row(f"zug-{i}", "zugspitz", datetime(2026, 6, 2 + i, tzinfo=timezone.utc)))
    for i in range(4):
        rows.append(_row(f"zug-prev-{i}", "zugspitz", datetime(2026, 5, 10 + i, tzinfo=timezone.utc)))
    importer.import_rows(tenant.id, source.id, rows)

    service = ForecastService(SocialContentRepository(db), PlaceRepository(db))
    result = service.compute(
        tenant.id,
        date_from=datetime(2026, 6, 1, tzinfo=timezone.utc),
        date_to=datetime(2026, 6, 30, tzinfo=timezone.utc),
        platform=None,
        region=None,
        source_id=None,
    )

    by_name = {c.place_name: c for c in result.cells}
    zugspitze = by_name["Zugspitze"]
    assert zugspitze.trend_pct == 200.0
    assert zugspitze.confidence == "high"
    assert zugspitze.forecast_score > zugspitze.attention_score
    assert zugspitze.forecast_score_low < zugspitze.forecast_score < zugspitze.forecast_score_high
    assert result.not_yet_connected == ["weather", "events/ticketing", "mobile/location data"]


def test_forecast_has_low_confidence_without_previous_period_data(db, bavarian_places):
    tenant = TenantRepository(db).create(name="Test", slug="test-forecast-no-history")
    source = SourceRepository(db).get_or_create(tenant.id, name="Fixture", source_type=SourceType.SOCIAL_IMPORT)
    importer = SocialContentImporter(db)
    importer.import_rows(
        tenant.id, source.id, [_row("eib-1", "eibsee", datetime(2026, 6, 12, tzinfo=timezone.utc))]
    )

    service = ForecastService(SocialContentRepository(db), PlaceRepository(db))
    result = service.compute(
        tenant.id,
        date_from=None,
        date_to=None,
        platform=None,
        region=None,
        source_id=None,
    )

    eibsee = next(c for c in result.cells if c.place_name == "Eibsee")
    assert eibsee.trend_pct is None
    assert eibsee.confidence == "low"
    assert eibsee.forecast_score == eibsee.attention_score
