"""Transparent attention aggregation.

For each place with at least one location-matched social-content item in the
filtered set, we compute:

    attention_score = (post_count_weight   * normalised_post_count)
                     + (reach_weight       * normalised_total_reach)
                     + (engagement_weight  * normalised_total_engagement)

Each metric is min-max normalised across the current result set (0..1) before
weighting, so the score is comparable across places within one query but is
NOT an absolute, cross-query metric. Weights are fixed and documented below;
they are intentionally simple (no learned/ML weighting). This score measures
*social-media attention*, not actual visitor numbers — see docs/architecture.md.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.domain.social_content.models import SocialContentItem
from app.infrastructure.repositories.places import PlaceRepository
from app.infrastructure.repositories.social_content import SocialContentRepository

ATTENTION_WEIGHTS: dict[str, float] = {
    "post_count": 0.4,
    "reach": 0.35,
    "engagement": 0.25,
}


@dataclass
class AttentionCell:
    place_id: uuid.UUID
    place_name: str
    lon: float
    lat: float
    post_count: int = 0
    total_reach: int = 0
    total_engagement: int = 0
    unique_creators: int = 0
    change_vs_previous_period: float | None = None
    avg_confidence: float = 0.0
    attention_score: float = 0.0


@dataclass
class AttentionResult:
    generated_at: datetime
    weights: dict[str, float]
    cells: list[AttentionCell] = field(default_factory=list)


def _normalise(values: list[float]) -> list[float]:
    if not values:
        return []
    lo, hi = min(values), max(values)
    if hi == lo:
        return [1.0 if hi > 0 else 0.0 for _ in values]
    return [(v - lo) / (hi - lo) for v in values]


class AttentionAggregator:
    def __init__(self, social_content_repo: SocialContentRepository, place_repo: PlaceRepository) -> None:
        self._content_repo = social_content_repo
        self._places = place_repo

    def compute(
        self,
        tenant_id: uuid.UUID,
        *,
        date_from: datetime | None,
        date_to: datetime | None,
        platform: str | None,
        region: str | None,
        source_id: uuid.UUID | None,
    ) -> AttentionResult:
        items = self._content_repo.list_for_tenant(
            tenant_id,
            published_after=date_from,
            published_before=date_to,
            platform=platform,
            region=region,
            source_id=source_id,
            limit=10_000,
        )

        previous_items: list[SocialContentItem] = []
        if date_from is not None and date_to is not None:
            duration = date_to - date_from
            previous_items = self._content_repo.list_for_tenant(
                tenant_id,
                published_after=date_from - duration,
                published_before=date_from,
                platform=platform,
                region=region,
                source_id=source_id,
                limit=10_000,
            )

        by_place: dict[uuid.UUID, dict] = {}
        for item in items:
            for match in item.location_matches:
                bucket = by_place.setdefault(
                    match.place_id,
                    {"items": [], "confidences": []},
                )
                bucket["items"].append(item)
                bucket["confidences"].append(match.confidence)

        previous_counts: dict[uuid.UUID, int] = {}
        for item in previous_items:
            for match in item.location_matches:
                previous_counts[match.place_id] = previous_counts.get(match.place_id, 0) + 1

        places_by_id = {p.id: p for p in self._places.list_all()}

        cells: list[AttentionCell] = []
        for place_id, bucket in by_place.items():
            place = places_by_id.get(place_id)
            if place is None:
                continue
            place_items: list[SocialContentItem] = bucket["items"]
            lon, lat = self._places.centroid_lon_lat(place)
            post_count = len(place_items)
            total_reach = sum(i.estimated_reach for i in place_items)
            total_engagement = sum(i.engagement_count for i in place_items)
            unique_creators = len({i.author_name for i in place_items if i.author_name})
            avg_confidence = sum(bucket["confidences"]) / len(bucket["confidences"])

            change = None
            if date_from is not None and date_to is not None:
                previous = previous_counts.get(place_id, 0)
                change = _percentage_change(previous, post_count)

            cells.append(
                AttentionCell(
                    place_id=place_id,
                    place_name=place.name,
                    lon=lon,
                    lat=lat,
                    post_count=post_count,
                    total_reach=total_reach,
                    total_engagement=total_engagement,
                    unique_creators=unique_creators,
                    change_vs_previous_period=change,
                    avg_confidence=round(avg_confidence, 3),
                )
            )

        post_counts = _normalise([float(c.post_count) for c in cells])
        reaches = _normalise([float(c.total_reach) for c in cells])
        engagements = _normalise([float(c.total_engagement) for c in cells])
        for cell, npc, nr, ne in zip(cells, post_counts, reaches, engagements):
            cell.attention_score = round(
                ATTENTION_WEIGHTS["post_count"] * npc
                + ATTENTION_WEIGHTS["reach"] * nr
                + ATTENTION_WEIGHTS["engagement"] * ne,
                4,
            )

        cells.sort(key=lambda c: c.attention_score, reverse=True)
        return AttentionResult(generated_at=datetime.now(timezone.utc), weights=ATTENTION_WEIGHTS, cells=cells)


def _percentage_change(previous: int, current: int) -> float | None:
    if previous == 0:
        return None if current == 0 else 100.0
    return round(((current - previous) / previous) * 100.0, 1)
