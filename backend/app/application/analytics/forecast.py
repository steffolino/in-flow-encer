"""Naive trend-extrapolation forecast.

For each place with an attention score in the requested period, we project
the *next* equivalent-length period by extending the trend already computed
by `AttentionAggregator` (`change_vs_previous_period`, i.e. the percentage
change from the previous period to the current one):

    forecast_score = attention_score * (1 + change_vs_previous_period / 100)

When there is no previous-period data to compare against,
`change_vs_previous_period` is `None` and the forecast simply repeats the
current score with a "low" confidence band. This is intentionally simple
(no time-series model, no ML, no learned parameters) so the projection is
auditable end-to-end: given the two input numbers, anyone can recompute it
by hand. See docs/adr/0008-naive-trend-forecast.md.

Confidence is a documented function of sample size (post_count), not a
statistical estimate: more posts observed this period means the trend is
based on more data, not that the projection itself is more likely correct.
Each band has a fixed +/- spread (as a fraction of the forecast score) used
to render `forecast_score_low`/`forecast_score_high`.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime

from app.application.analytics.attention import ATTENTION_WEIGHTS, AttentionAggregator
from app.infrastructure.repositories.places import PlaceRepository
from app.infrastructure.repositories.social_content import SocialContentRepository

CONFIDENCE_THRESHOLDS = {"high": 10, "medium": 3}
CONFIDENCE_SPREAD = {"high": 0.10, "medium": 0.25, "low": 0.50}
NOT_YET_CONNECTED = ["weather", "events/ticketing", "mobile/location data"]


@dataclass
class ForecastCell:
    place_id: uuid.UUID
    place_name: str
    lon: float
    lat: float
    attention_score: float
    forecast_score: float
    forecast_score_low: float
    forecast_score_high: float
    trend_pct: float | None
    confidence: str
    drivers: dict[str, float] = field(default_factory=dict)


@dataclass
class ForecastResult:
    generated_at: datetime
    method: str
    not_yet_connected: list[str]
    cells: list[ForecastCell] = field(default_factory=list)


def _confidence_band(post_count: int) -> str:
    if post_count >= CONFIDENCE_THRESHOLDS["high"]:
        return "high"
    if post_count >= CONFIDENCE_THRESHOLDS["medium"]:
        return "medium"
    return "low"


class ForecastService:
    def __init__(self, social_content_repo: SocialContentRepository, place_repo: PlaceRepository) -> None:
        self._attention = AttentionAggregator(social_content_repo, place_repo)

    def compute(
        self,
        tenant_id: uuid.UUID,
        *,
        date_from: datetime | None,
        date_to: datetime | None,
        platform: str | None,
        region: str | None,
        source_id: uuid.UUID | None,
    ) -> ForecastResult:
        attention = self._attention.compute(
            tenant_id,
            date_from=date_from,
            date_to=date_to,
            platform=platform,
            region=region,
            source_id=source_id,
        )

        cells: list[ForecastCell] = []
        for cell in attention.cells:
            trend_pct = cell.change_vs_previous_period
            multiplier = 1.0 if trend_pct is None else 1 + trend_pct / 100
            forecast_score = max(0.0, round(cell.attention_score * multiplier, 4))
            confidence = _confidence_band(cell.post_count)
            spread = CONFIDENCE_SPREAD[confidence] * forecast_score

            cells.append(
                ForecastCell(
                    place_id=cell.place_id,
                    place_name=cell.place_name,
                    lon=cell.lon,
                    lat=cell.lat,
                    attention_score=cell.attention_score,
                    forecast_score=forecast_score,
                    forecast_score_low=round(max(0.0, forecast_score - spread), 4),
                    forecast_score_high=round(forecast_score + spread, 4),
                    trend_pct=trend_pct,
                    confidence=confidence,
                    drivers=dict(ATTENTION_WEIGHTS),
                )
            )

        cells.sort(key=lambda c: c.forecast_score, reverse=True)
        return ForecastResult(
            generated_at=attention.generated_at,
            method=(
                "forecast_score = attention_score * (1 + change_vs_previous_period / 100); "
                "no machine learning, see docs/adr/0008-naive-trend-forecast.md"
            ),
            not_yet_connected=NOT_YET_CONNECTED,
            cells=cells,
        )
