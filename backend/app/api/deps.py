"""Development tenant resolution.

For the MVP, the active tenant is resolved from a trusted request header
(`X-Tenant-Slug`, see Settings.dev_tenant_header) rather than production
OIDC. See docs/architecture.md ("Future authentication strategy") for how
this would be replaced by a real identity provider without changing any
downstream tenant-scoped code, since every service already takes a resolved
`tenant_id` rather than trusting client-supplied identifiers.
"""

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.session import get_db
from app.domain.tenancy.models import Tenant
from app.infrastructure.repositories.tenants import TenantRepository

settings = get_settings()


def get_current_tenant(
    x_tenant_slug: str | None = Header(default=None, alias="X-Tenant-Slug"),
    db: Session = Depends(get_db),
) -> Tenant:
    if not x_tenant_slug:
        raise HTTPException(status_code=401, detail="X-Tenant-Slug header is required in development mode")
    tenant = TenantRepository(db).get_by_slug(x_tenant_slug)
    if tenant is None:
        raise HTTPException(status_code=403, detail="Unknown tenant")
    return tenant
