from uuid import UUID

from fastapi import APIRouter, Depends, Form, UploadFile
from geoalchemy2.shape import to_shape
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant
from app.api.schemas import OverlayLayerOut, OverlayLayerPatch, OverlaySourceOut
from app.application.overlays.service import OverlayImportService
from app.config import get_settings
from app.db.session import get_db
from app.domain.shared.exceptions import ValidationFailedError
from app.domain.sources.models import Source
from app.domain.tenancy.models import Tenant
from app.infrastructure.repositories.overlays import OverlayRepository

router = APIRouter(prefix="/overlays", tags=["overlays"])
settings = get_settings()


def _layer_out(layer, source: Source, feature_count: int) -> OverlayLayerOut:
    return OverlayLayerOut(
        id=layer.id,
        name=layer.name,
        description=layer.description,
        geometry_type=layer.geometry_type,
        measurement_type=layer.measurement_type,
        unit=layer.unit,
        visibility=layer.visibility,
        time_field=layer.time_field,
        source=OverlaySourceOut(name=source.name, provider=source.provider, last_updated_at=source.last_updated_at),
        feature_count=feature_count,
    )


@router.get("", response_model=list[OverlayLayerOut])
def list_overlays(
    tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)
) -> list[OverlayLayerOut]:
    repo = OverlayRepository(db)
    layers = repo.list_for_tenant(tenant.id)
    out = []
    for layer in layers:
        source = db.get(Source, layer.source_id)
        features = repo.list_features(tenant.id, layer.id)
        out.append(_layer_out(layer, source, len(features)))
    return out


@router.get("/{layer_id}/features")
def get_overlay_features(
    layer_id: UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)
) -> dict:
    repo = OverlayRepository(db)
    layer = repo.get_for_tenant(tenant.id, layer_id)
    features = repo.list_features(tenant.id, layer.id)
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": to_shape(f.geometry).__geo_interface__,
                "properties": {
                    **f.properties,
                    "value": f.value,
                    "observed_at": f.observed_at.isoformat() if f.observed_at else None,
                    "external_id": f.external_id,
                },
            }
            for f in features
        ],
    }


async def _validate_upload(file: UploadFile) -> bytes:
    filename = file.filename or ""
    if not any(filename.lower().endswith(ext) for ext in settings.allowed_upload_extensions):
        raise ValidationFailedError(
            f"Unsupported file type for '{filename}'. Allowed: {', '.join(settings.allowed_upload_extensions)}"
        )
    body = await file.read()
    if len(body) > settings.max_upload_bytes:
        raise ValidationFailedError(f"File exceeds the {settings.max_upload_bytes} byte upload limit")
    return body


@router.post("/import/csv")
async def import_csv_overlay(
    file: UploadFile,
    name: str = Form(...),
    measurement_type: str = Form(...),
    unit: str | None = Form(default=None),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> dict:
    body = await _validate_upload(file)
    service = OverlayImportService(db)
    _layer, report = service.import_csv(tenant.id, body, name=name, measurement_type=measurement_type, unit=unit)
    db.commit()
    return report.model_dump()


@router.post("/import/geojson")
async def import_geojson_overlay(
    file: UploadFile,
    name: str = Form(...),
    measurement_type: str = Form(...),
    unit: str | None = Form(default=None),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> dict:
    body = await _validate_upload(file)
    service = OverlayImportService(db)
    _layer, report = service.import_geojson(
        tenant.id, body, name=name, measurement_type=measurement_type, unit=unit
    )
    db.commit()
    return report.model_dump()


@router.patch("/{layer_id}", response_model=OverlayLayerOut)
def patch_overlay(
    layer_id: UUID,
    patch: OverlayLayerPatch,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> OverlayLayerOut:
    repo = OverlayRepository(db)
    layer = repo.get_for_tenant(tenant.id, layer_id)
    if patch.visibility is not None:
        layer.visibility = patch.visibility
    if patch.name is not None:
        layer.name = patch.name
    if patch.style_configuration is not None:
        layer.style_configuration = patch.style_configuration
    db.commit()
    source = db.get(Source, layer.source_id)
    features = repo.list_features(tenant.id, layer.id)
    return _layer_out(layer, source, len(features))


@router.delete("/{layer_id}", status_code=204)
def delete_overlay(
    layer_id: UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)
) -> None:
    repo = OverlayRepository(db)
    layer = repo.get_for_tenant(tenant.id, layer_id)
    repo.delete_layer(layer)
    db.commit()
