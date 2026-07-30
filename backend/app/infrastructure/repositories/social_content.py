import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.domain.locations.models import Place
from app.domain.social_content.models import LocationMatch, SocialContentItem


class SocialContentRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def find_by_hash(
        self, tenant_id: uuid.UUID, source_id: uuid.UUID, content_hash: str
    ) -> SocialContentItem | None:
        stmt = select(SocialContentItem).where(
            SocialContentItem.tenant_id == tenant_id,
            SocialContentItem.source_id == source_id,
            SocialContentItem.content_hash == content_hash,
        )
        return self._db.execute(stmt).scalar_one_or_none()

    def find_by_external_id(
        self, tenant_id: uuid.UUID, source_id: uuid.UUID, external_id: str
    ) -> SocialContentItem | None:
        stmt = select(SocialContentItem).where(
            SocialContentItem.tenant_id == tenant_id,
            SocialContentItem.source_id == source_id,
            SocialContentItem.external_id == external_id,
        )
        return self._db.execute(stmt).scalar_one_or_none()

    def delete_location_matches(self, social_content_id: uuid.UUID) -> None:
        stmt = select(LocationMatch).where(LocationMatch.social_content_id == social_content_id)
        for match in self._db.execute(stmt).scalars():
            self._db.delete(match)
        self._db.flush()

    def add(self, item: SocialContentItem) -> SocialContentItem:
        self._db.add(item)
        self._db.flush()
        return item

    def add_location_match(self, match: LocationMatch) -> LocationMatch:
        self._db.add(match)
        self._db.flush()
        return match

    def _filtered_query(
        self,
        tenant_id: uuid.UUID,
        *,
        published_after: datetime | None,
        published_before: datetime | None,
        platform: str | None,
        source_id: uuid.UUID | None,
        region: str | None,
        author_category: str | None,
    ):
        stmt = select(SocialContentItem).where(SocialContentItem.tenant_id == tenant_id)
        if published_after is not None:
            stmt = stmt.where(SocialContentItem.published_at >= published_after)
        if published_before is not None:
            stmt = stmt.where(SocialContentItem.published_at <= published_before)
        if platform is not None:
            stmt = stmt.where(SocialContentItem.platform == platform)
        if source_id is not None:
            stmt = stmt.where(SocialContentItem.source_id == source_id)
        if author_category is not None:
            stmt = stmt.where(SocialContentItem.author_category == author_category)
        if region is not None:
            matching_ids = select(LocationMatch.social_content_id).join(
                Place, Place.id == LocationMatch.place_id
            ).where(Place.region == region)
            stmt = stmt.where(SocialContentItem.id.in_(matching_ids))
        return stmt

    def list_for_tenant(
        self,
        tenant_id: uuid.UUID,
        *,
        published_after: datetime | None = None,
        published_before: datetime | None = None,
        platform: str | None = None,
        source_id: uuid.UUID | None = None,
        region: str | None = None,
        author_category: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[SocialContentItem]:
        stmt = self._filtered_query(
            tenant_id,
            published_after=published_after,
            published_before=published_before,
            platform=platform,
            source_id=source_id,
            region=region,
            author_category=author_category,
        ).options(selectinload(SocialContentItem.location_matches))
        stmt = stmt.order_by(SocialContentItem.published_at.desc()).offset(offset).limit(limit)
        return list(self._db.execute(stmt).scalars())

    def count_for_tenant(
        self,
        tenant_id: uuid.UUID,
        *,
        published_after: datetime | None = None,
        published_before: datetime | None = None,
        platform: str | None = None,
        source_id: uuid.UUID | None = None,
        region: str | None = None,
        author_category: str | None = None,
    ) -> int:
        stmt = self._filtered_query(
            tenant_id,
            published_after=published_after,
            published_before=published_before,
            platform=platform,
            source_id=source_id,
            region=region,
            author_category=author_category,
        )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        return self._db.execute(count_stmt).scalar_one()
