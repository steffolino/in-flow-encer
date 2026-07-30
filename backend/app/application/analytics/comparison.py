"""Attention vs. visitor-flow comparison.

Classification uses simple, transparent thresholds (mean split) rather than
any statistical or ML model:

  - attention_level  = "high" if a place's attention_score >= the mean score
                        across places with any attention data, else "low".
  - visitor_flow_level = "high"/"low" using the same mean-split rule over
                        overlay feature values found within
                        VISITOR_FLOW_RADIUS_KM of the place centroid, or
                        "unknown" if no overlay feature is within range.

This is intentionally simple and documented so the output is auditable -
no AI is involved.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime

from geoalchemy2.shape import to_shape

from app.application.analytics.attention import AttentionAggregator
from app.application.ingestion.matching import haversine_km
from app.domain.overlays.models import OverlayFeature
from app.infrastructure.repositories.overlays import OverlayRepository
from app.infrastructure.repositories.places import PlaceRepository
from app.infrastructure.repositories.social_content import SocialContentRepository

VISITOR_FLOW_RADIUS_KM = 3.0


@dataclass
class ComparisonItem:
    place_id: uuid.UUID
    place_name: str
    attention_level: str
    visitor_flow_level: str
    statement: str


@dataclass
class ComparisonResult:
    thresholds: dict[str, float | None]
    items: list[ComparisonItem] = field(default_factory=list)


_STATEMENTS = {
    ("high", "high"): "High social attention and high visitor-flow values",
    ("high", "low"): "High social attention and low measured visitor flow",
    ("low", "high"): "Low social attention and high visitor-flow values",
    ("low", "low"): "Low social attention and low visitor-flow values",
    ("high", "unknown"): "High social attention; no visitor-flow data available for comparison",
    ("low", "unknown"): "Low social attention; no visitor-flow data available for comparison",
}


class ComparisonService:
    def __init__(
        self,
        social_content_repo: SocialContentRepository,
        place_repo: PlaceRepository,
        overlay_repo: OverlayRepository,
    ) -> None:
        self._attention = AttentionAggregator(social_content_repo, place_repo)
        self._places = place_repo
        self._overlays = overlay_repo

    def compare(
        self,
        tenant_id: uuid.UUID,
        *,
        date_from: datetime | None,
        date_to: datetime | None,
        region: str | None,
    ) -> ComparisonResult:
        attention = self._attention.compute(
            tenant_id,
            date_from=date_from,
            date_to=date_to,
            platform=None,
            region=region,
            source_id=None,
        )
        if not attention.cells:
            return ComparisonResult(thresholds={"attention_mean": None, "visitor_flow_mean": None})

        attention_mean = sum(c.attention_score for c in attention.cells) / len(attention.cells)

        all_features: list[OverlayFeature] = []
        for layer in self._overlays.list_for_tenant(tenant_id):
            if layer.visibility:
                all_features.extend(self._overlays.list_features(tenant_id, layer.id))

        flow_by_place: dict[uuid.UUID, float] = {}
        for cell in attention.cells:
            total = 0.0
            found = False
            for feature in all_features:
                if feature.value is None:
                    continue
                point = to_shape(feature.geometry).centroid
                distance = haversine_km(cell.lon, cell.lat, point.x, point.y)
                if distance <= VISITOR_FLOW_RADIUS_KM:
                    total += feature.value
                    found = True
            if found:
                flow_by_place[cell.place_id] = total

        visitor_flow_mean = (
            sum(flow_by_place.values()) / len(flow_by_place) if flow_by_place else None
        )

        items: list[ComparisonItem] = []
        for cell in attention.cells:
            attention_level = "high" if cell.attention_score >= attention_mean else "low"
            if cell.place_id in flow_by_place and visitor_flow_mean is not None:
                visitor_flow_level = "high" if flow_by_place[cell.place_id] >= visitor_flow_mean else "low"
            else:
                visitor_flow_level = "unknown"
            statement = _STATEMENTS[(attention_level, visitor_flow_level)]
            items.append(
                ComparisonItem(
                    place_id=cell.place_id,
                    place_name=cell.place_name,
                    attention_level=attention_level,
                    visitor_flow_level=visitor_flow_level,
                    statement=statement,
                )
            )

        return ComparisonResult(
            thresholds={"attention_mean": round(attention_mean, 4), "visitor_flow_mean": visitor_flow_mean},
            items=items,
        )
