from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant
from app.api.schemas import (
    AttentionCellOut,
    AttentionResponse,
    ComparisonItemOut,
    ComparisonResponse,
)
from app.application.analytics.attention import AttentionAggregator
from app.application.analytics.comparison import ComparisonService
from app.db.session import get_db
from app.domain.tenancy.models import Tenant
from app.infrastructure.repositories.overlays import OverlayRepository
from app.infrastructure.repositories.places import PlaceRepository
from app.infrastructure.repositories.social_content import SocialContentRepository

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/attention", response_model=AttentionResponse)
def get_attention(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    platform: str | None = Query(default=None),
    region: str | None = Query(default=None),
    source_id: UUID | None = Query(default=None),
) -> AttentionResponse:
    aggregator = AttentionAggregator(SocialContentRepository(db), PlaceRepository(db))
    result = aggregator.compute(
        tenant.id, date_from=date_from, date_to=date_to, platform=platform, region=region, source_id=source_id
    )
    return AttentionResponse(
        generated_at=result.generated_at,
        weights=result.weights,
        cells=[AttentionCellOut(**vars(cell)) for cell in result.cells],
    )


@router.get("/comparison", response_model=ComparisonResponse)
def get_comparison(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    region: str | None = Query(default=None),
) -> ComparisonResponse:
    service = ComparisonService(SocialContentRepository(db), PlaceRepository(db), OverlayRepository(db))
    result = service.compare(tenant.id, date_from=date_from, date_to=date_to, region=region)
    return ComparisonResponse(
        thresholds=result.thresholds,
        items=[ComparisonItemOut(**vars(item)) for item in result.items],
    )
