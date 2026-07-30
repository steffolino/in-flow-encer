import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.overlays.models import OverlayFeature, OverlayLayer
from app.domain.shared.exceptions import NotFoundError


class OverlayRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_for_tenant(self, tenant_id: uuid.UUID) -> list[OverlayLayer]:
        stmt = select(OverlayLayer).where(OverlayLayer.tenant_id == tenant_id).order_by(OverlayLayer.created_at)
        return list(self._db.execute(stmt).scalars())

    def find_by_tenant_and_name(self, tenant_id: uuid.UUID, name: str) -> OverlayLayer | None:
        stmt = select(OverlayLayer).where(OverlayLayer.tenant_id == tenant_id, OverlayLayer.name == name)
        return self._db.execute(stmt).scalar_one_or_none()

    def get_for_tenant(self, tenant_id: uuid.UUID, layer_id: uuid.UUID) -> OverlayLayer:
        layer = self._db.get(OverlayLayer, layer_id)
        if layer is None or layer.tenant_id != tenant_id:
            raise NotFoundError(f"Overlay layer {layer_id} not found")
        return layer

    def create_layer(self, layer: OverlayLayer) -> OverlayLayer:
        self._db.add(layer)
        self._db.flush()
        return layer

    def delete_layer(self, layer: OverlayLayer) -> None:
        self._db.delete(layer)
        self._db.flush()

    def find_feature_by_hash(
        self, tenant_id: uuid.UUID, layer_id: uuid.UUID, content_hash: str
    ) -> OverlayFeature | None:
        stmt = select(OverlayFeature).where(
            OverlayFeature.tenant_id == tenant_id,
            OverlayFeature.layer_id == layer_id,
            OverlayFeature.content_hash == content_hash,
        )
        return self._db.execute(stmt).scalar_one_or_none()

    def add_feature(self, feature: OverlayFeature) -> OverlayFeature:
        self._db.add(feature)
        self._db.flush()
        return feature

    def list_features(self, tenant_id: uuid.UUID, layer_id: uuid.UUID) -> list[OverlayFeature]:
        stmt = select(OverlayFeature).where(
            OverlayFeature.tenant_id == tenant_id, OverlayFeature.layer_id == layer_id
        )
        return list(self._db.execute(stmt).scalars())
