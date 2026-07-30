import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.shared.exceptions import NotFoundError
from app.domain.tenancy.models import Tenant


class TenantRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_all(self) -> list[Tenant]:
        return list(self._db.execute(select(Tenant).order_by(Tenant.name)).scalars())

    def get_by_slug(self, slug: str) -> Tenant | None:
        return self._db.execute(select(Tenant).where(Tenant.slug == slug)).scalar_one_or_none()

    def get_by_id(self, tenant_id: uuid.UUID) -> Tenant:
        tenant = self._db.get(Tenant, tenant_id)
        if tenant is None:
            raise NotFoundError(f"Tenant {tenant_id} not found")
        return tenant

    def create(self, name: str, slug: str) -> Tenant:
        tenant = Tenant(name=name, slug=slug)
        self._db.add(tenant)
        self._db.flush()
        return tenant
