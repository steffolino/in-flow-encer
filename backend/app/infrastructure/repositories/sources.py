import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.shared.exceptions import NotFoundError
from app.domain.sources.models import Source, SourceType


class SourceRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_for_tenant(self, tenant_id: uuid.UUID, source_id: uuid.UUID) -> Source:
        source = self._db.get(Source, source_id)
        if source is None or source.tenant_id != tenant_id:
            raise NotFoundError(f"Source {source_id} not found")
        return source

    def list_for_tenant(self, tenant_id: uuid.UUID) -> list[Source]:
        stmt = select(Source).where(Source.tenant_id == tenant_id).order_by(Source.created_at)
        return list(self._db.execute(stmt).scalars())

    def get_or_create(
        self,
        tenant_id: uuid.UUID,
        name: str,
        source_type: SourceType,
        provider: str | None = None,
        description: str | None = None,
        source_url: str | None = None,
    ) -> Source:
        stmt = select(Source).where(Source.tenant_id == tenant_id, Source.name == name)
        existing = self._db.execute(stmt).scalar_one_or_none()
        if existing is not None:
            existing.last_updated_at = datetime.now(timezone.utc)
            self._db.flush()
            return existing
        source = Source(
            tenant_id=tenant_id,
            name=name,
            source_type=source_type,
            provider=provider,
            description=description,
            source_url=source_url,
            last_updated_at=datetime.now(timezone.utc),
        )
        self._db.add(source)
        self._db.flush()
        return source
