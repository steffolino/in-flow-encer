# ADR 0003: PostGIS for all geospatial storage

## Status
Accepted

## Context
Places, social-content coordinates, and overlay features all need spatial
storage and querying (point/line/polygon, distance, containment).

## Decision
Use PostgreSQL with the PostGIS extension via `geoalchemy2` for every
geometry column (`places.geometry`, `overlay_features.geometry`), storing
all geometry as SRID 4326 (WGS84). GIST indexes are created automatically
by geoalchemy2 on each geometry column.

## Consequences
- One database technology for both relational and spatial data — no
  separate spatial engine or vendored GIS library ("no custom GIS engine",
  per the directive).
- Distance calculations in the MVP's matching and comparison logic
  (`haversine_km` in `matching.py`) are done in Python on retrieved
  centroids rather than as PostGIS `ST_DWithin` queries, because the
  gazetteer is small (~8 places) for this MVP; if the gazetteer grows
  significantly, these should move to PostGIS spatial queries (indexes are
  already in place to support that).
- Requires the `postgis/postgis` Docker image (not plain `postgres`) and an
  explicit `CREATE EXTENSION postgis` in the initial migration.
