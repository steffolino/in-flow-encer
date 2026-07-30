"""Parsing and validation for customer-supplied CSV and GeoJSON overlay uploads."""

import csv
import io
import json
from dataclasses import dataclass
from datetime import datetime

from shapely.geometry import shape as shapely_shape
from shapely.geometry.base import BaseGeometry

SUPPORTED_GEOJSON_TYPES = {
    "Point",
    "LineString",
    "Polygon",
    "MultiPoint",
    "MultiLineString",
    "MultiPolygon",
}

REQUIRED_CSV_COLUMNS = {"latitude", "longitude", "timestamp", "value"}


class OverlayParseError(Exception):
    """Raised when an uploaded file is malformed beyond row-level recovery."""


@dataclass
class ParsedFeature:
    geometry: BaseGeometry
    observed_at: datetime | None
    value: float | None
    label: str | None
    external_id: str | None
    properties: dict


@dataclass
class ParseOutcome:
    features: list[ParsedFeature]
    row_errors: list[tuple[int, str]]


def parse_csv(raw_bytes: bytes) -> ParseOutcome:
    try:
        text = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise OverlayParseError(f"File is not valid UTF-8 text: {exc}") from exc

    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise OverlayParseError("CSV file has no header row")

    header = {name.strip().lower() for name in reader.fieldnames}
    missing = REQUIRED_CSV_COLUMNS - header
    if missing:
        raise OverlayParseError(
            f"CSV is missing required column(s): {', '.join(sorted(missing))}. "
            f"Required columns are: {', '.join(sorted(REQUIRED_CSV_COLUMNS))}."
        )

    features: list[ParsedFeature] = []
    row_errors: list[tuple[int, str]] = []

    for index, row in enumerate(reader):
        normalised_row = {k.strip().lower(): (v.strip() if v else v) for k, v in row.items() if k}
        try:
            lat = float(normalised_row["latitude"])
            lon = float(normalised_row["longitude"])
            if not (-90.0 <= lat <= 90.0):
                raise ValueError("latitude out of range")
            if not (-180.0 <= lon <= 180.0):
                raise ValueError("longitude out of range")
            timestamp_raw = normalised_row["timestamp"]
            observed_at = datetime.fromisoformat(timestamp_raw) if timestamp_raw else None
            value_raw = normalised_row["value"]
            value = float(value_raw) if value_raw not in (None, "") else None
        except (KeyError, ValueError, TypeError) as exc:
            row_errors.append((index, f"Row {index}: {exc}"))
            continue

        features.append(
            ParsedFeature(
                geometry=shapely_shape({"type": "Point", "coordinates": [lon, lat]}),
                observed_at=observed_at,
                value=value,
                label=normalised_row.get("label") or None,
                external_id=normalised_row.get("external_id") or None,
                properties={k: v for k, v in normalised_row.items()},
            )
        )

    return ParseOutcome(features=features, row_errors=row_errors)


def parse_geojson(raw_bytes: bytes) -> ParseOutcome:
    try:
        data = json.loads(raw_bytes.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise OverlayParseError(f"File is not valid JSON: {exc}") from exc

    if not isinstance(data, dict) or data.get("type") != "FeatureCollection":
        raise OverlayParseError("GeoJSON must be a FeatureCollection")

    raw_features = data.get("features")
    if not isinstance(raw_features, list):
        raise OverlayParseError("GeoJSON FeatureCollection is missing a 'features' array")

    features: list[ParsedFeature] = []
    row_errors: list[tuple[int, str]] = []

    for index, feature in enumerate(raw_features):
        try:
            if not isinstance(feature, dict) or feature.get("type") != "Feature":
                raise ValueError("not a valid GeoJSON Feature")
            geometry_raw = feature.get("geometry")
            if not isinstance(geometry_raw, dict):
                raise ValueError("missing geometry")
            geometry_type = geometry_raw.get("type")
            if geometry_type not in SUPPORTED_GEOJSON_TYPES:
                raise ValueError(f"unsupported geometry type '{geometry_type}'")
            geometry = shapely_shape(geometry_raw)
            if not geometry.is_valid:
                raise ValueError("geometry is not valid (self-intersecting or malformed)")

            properties = feature.get("properties") or {}
            if not isinstance(properties, dict):
                raise ValueError("properties must be an object")

            observed_at_raw = properties.get("observed_at") or properties.get("timestamp")
            observed_at = datetime.fromisoformat(observed_at_raw) if observed_at_raw else None
            value_raw = properties.get("value")
            value = float(value_raw) if value_raw is not None else None
        except (ValueError, TypeError) as exc:
            row_errors.append((index, f"Feature {index}: {exc}"))
            continue

        features.append(
            ParsedFeature(
                geometry=geometry,
                observed_at=observed_at,
                value=value,
                label=properties.get("label"),
                external_id=properties.get("external_id"),
                properties=properties,
            )
        )

    return ParseOutcome(features=features, row_errors=row_errors)
