from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.schemas import TenantOut
from app.db.session import get_db
from app.infrastructure.repositories.tenants import TenantRepository

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.get("", response_model=list[TenantOut])
def list_tenants(db: Session = Depends(get_db)) -> list[TenantOut]:
    tenants = TenantRepository(db).list_all()
    return [TenantOut.model_validate(t) for t in tenants]
