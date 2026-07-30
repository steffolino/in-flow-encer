import hashlib
import uuid

from geoalchemy2.elements import WKTElement
from sqlalchemy.orm import Session

from app.application.shared.import_report import ImportReport, ImportWarning
from app.domain.overlays.models import GeometryType, OverlayFeature, OverlayLayer
from app.domain.shared.exceptions import ValidationFailedError
from app.domain.sources.models import SourceType
from app.infrastructure.repositories.overlays import OverlayRepository
from app.infrastructure.repositories.sources import SourceRepository

from .parsing import OverlayParseError, ParsedFeature, ParseOutcome, parse_csv, parse_geojson


def _feature_hash(tenant_id: uuid.UUID, feature: ParsedFeature) -> str:
    if feature.external_id:
        basis = f"{tenant_id}|{feature.external_id}"
    else:
        basis = "|".join(
            [
                str(tenant_id),
                feature.geometry.wkt,
                feature.observed_at.isoformat() if feature.observed_at else "",
                str(feature.value),
            ]
        )
    return hashlib.sha256(basis.encode("utf-8")).hexdigest()


class OverlayImportService:
    """Imports a customer CSV or GeoJSON file as a new overlay layer with features."""

    def __init__(self, db: Session) -> None:
        self._db = db
        self._overlays = OverlayRepository(db)
        self._sources = SourceRepository(db)

    def import_csv(
        self, tenant_id: uuid.UUID, file_bytes: bytes, *, name: str, measurement_type: str, unit: str | None
    ) -> tuple[OverlayLayer, ImportReport]:
        try:
            outcome = parse_csv(file_bytes)
        except OverlayParseError as exc:
            raise ValidationFailedError(str(exc)) from exc
        source = self._sources.get_or_create(
            tenant_id, name=name, source_type=SourceType.CSV_OVERLAY, provider="customer_upload"
        )
        layer = self._overlays.find_by_tenant_and_name(tenant_id, name)
        if layer is None:
            layer = self._overlays.create_layer(
                OverlayLayer(
                    tenant_id=tenant_id,
                    source_id=source.id,
                    name=name,
                    geometry_type=GeometryType.POINT.value,
                    measurement_type=measurement_type,
                    unit=unit,
                    time_field="timestamp",
                )
            )
        report = self._persist_features(tenant_id, layer, outcome)
        return layer, report

    def import_geojson(
        self, tenant_id: uuid.UUID, file_bytes: bytes, *, name: str, measurement_type: str, unit: str | None
    ) -> tuple[OverlayLayer, ImportReport]:
        try:
            outcome = parse_geojson(file_bytes)
        except OverlayParseError as exc:
            raise ValidationFailedError(str(exc)) from exc
        source = self._sources.get_or_create(
            tenant_id, name=name, source_type=SourceType.GEOJSON_OVERLAY, provider="customer_upload"
        )
        layer = self._overlays.find_by_tenant_and_name(tenant_id, name)
        if layer is None:
            geometry_type = (
                outcome.features[0].geometry.geom_type if outcome.features else GeometryType.POLYGON.value
            )
            layer = self._overlays.create_layer(
                OverlayLayer(
                    tenant_id=tenant_id,
                    source_id=source.id,
                    name=name,
                    geometry_type=geometry_type,
                    measurement_type=measurement_type,
                    unit=unit,
                    time_field="observed_at",
                )
            )
        report = self._persist_features(tenant_id, layer, outcome)
        return layer, report

    def _persist_features(
        self, tenant_id: uuid.UUID, layer: OverlayLayer, outcome: ParseOutcome
    ) -> ImportReport:
        report = ImportReport(received=len(outcome.features) + len(outcome.row_errors))
        for row_index, message in outcome.row_errors:
            report.invalid += 1
            report.warnings.append(ImportWarning(row=row_index, message=message))

        for feature in outcome.features:
            content_hash = _feature_hash(tenant_id, feature)
            existing = self._overlays.find_feature_by_hash(tenant_id, layer.id, content_hash)
            if existing is not None:
                report.duplicates += 1
                continue
            properties = dict(feature.properties)
            if feature.label:
                properties.setdefault("label", feature.label)
            self._overlays.add_feature(
                OverlayFeature(
                    tenant_id=tenant_id,
                    layer_id=layer.id,
                    geometry=WKTElement(feature.geometry.wkt, srid=4326),
                    observed_at=feature.observed_at,
                    value=feature.value,
                    properties=properties,
                    external_id=feature.external_id,
                    content_hash=content_hash,
                )
            )
            report.created += 1
        return report
