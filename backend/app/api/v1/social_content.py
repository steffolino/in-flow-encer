from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant
from app.api.schemas import (
    LocationMatchOut,
    SocialContentImportReport,
    SocialContentImportRequest,
    SocialContentItemOut,
    SocialContentListOut,
)
from app.application.ingestion.social_content_importer import SocialContentImporter
from app.db.session import get_db
from app.domain.shared.exceptions import ValidationFailedError
from app.domain.sources.models import SourceType
from app.domain.tenancy.models import Tenant
from app.infrastructure.repositories.places import PlaceRepository
from app.infrastructure.repositories.social_content import SocialContentRepository
from app.infrastructure.repositories.sources import SourceRepository

router = APIRouter(prefix="/social-content", tags=["social-content"])

MAX_IMPORT_ITEMS = 5_000


@router.post("/import", response_model=SocialContentImportReport)
def import_social_content(
    payload: SocialContentImportRequest,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> SocialContentImportReport:
    if len(payload.items) > MAX_IMPORT_ITEMS:
        raise ValidationFailedError(f"Import payload exceeds the {MAX_IMPORT_ITEMS}-item limit")

    source = SourceRepository(db).get_or_create(
        tenant.id, name=payload.source_name, source_type=SourceType.SOCIAL_IMPORT, provider=payload.provider
    )
    importer = SocialContentImporter(db)
    report = importer.import_rows(tenant.id, source.id, payload.items)
    db.commit()
    return report


@router.get("", response_model=SocialContentListOut)
def list_social_content(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    platform: str | None = Query(default=None),
    region: str | None = Query(default=None),
    source_id: UUID | None = Query(default=None),
    author_category: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> SocialContentListOut:
    repo = SocialContentRepository(db)
    places_by_id = {p.id: p for p in PlaceRepository(db).list_all()}
    items = repo.list_for_tenant(
        tenant.id,
        published_after=date_from,
        published_before=date_to,
        platform=platform,
        region=region,
        source_id=source_id,
        author_category=author_category,
        limit=limit,
        offset=offset,
    )
    out_items = [
        SocialContentItemOut(
            id=item.id,
            platform=item.platform,
            author_name=item.author_name,
            author_category=item.author_category,
            published_at=item.published_at,
            caption=item.caption,
            hashtags=item.hashtags,
            content_url=item.content_url,
            engagement_count=item.engagement_count,
            estimated_reach=item.estimated_reach,
            location_text=item.location_text,
            location_matches=[
                LocationMatchOut(
                    place_id=m.place_id,
                    place_name=places_by_id[m.place_id].name if m.place_id in places_by_id else "unknown",
                    method=m.method,
                    confidence=m.confidence,
                    matched_text=m.matched_text,
                )
                for m in item.location_matches
            ],
        )
        for item in items
    ]
    total = repo.count_for_tenant(
        tenant.id,
        published_after=date_from,
        published_before=date_to,
        platform=platform,
        region=region,
        source_id=source_id,
        author_category=author_category,
    )
    return SocialContentListOut(items=out_items, total=total)
