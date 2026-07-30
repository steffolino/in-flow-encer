# Data model

All tables live in one PostgreSQL/PostGIS database. Geometry columns use
SRID 4326. UUID primary keys throughout.

## Entities

### Tenant (`tenants`)
`id, name, slug (unique), created_at`. Represents one municipality, tourism
region, or organisation. Not owned by anyone else — every other tenant-owned
table points back to it.

### Source (`sources`)
`id, tenant_id, name, source_type, provider, description, source_url,
last_updated_at, created_at`. Provenance metadata for an import: where the
data came from. `source_type` is one of `social_import`, `csv_overlay`,
`geojson_overlay`, `rest_api`, `system_fixture`. Owned by a tenant.

### Place (`places`)
`id, name, place_type, municipality, district, region, country, geometry,
aliases`. The shared gazetteer (municipalities, lakes, mountains,
viewpoints). **Not** tenant-owned — every tenant matches against the same
reference gazetteer, since it's public geographic reference data, not
customer data.

### SocialContentItem (`social_content_items`)
`id, tenant_id, source_id, external_id, platform, author_name,
author_category, published_at, caption, hashtags, content_url,
engagement_count, estimated_reach, location_text, explicit_lat,
explicit_lon, content_hash, raw_metadata, created_at`. A canonicalised,
imported social-content record. Unique on `(tenant_id, source_id,
content_hash)` for idempotent import. Belongs to a `Tenant` and a `Source`.

### LocationMatch (`location_matches`)
`id, social_content_id, place_id, method, confidence, matched_text,
created_at`. Zero-or-more per `SocialContentItem` (a post can mention
several places, or none if unresolved). `method` is one of
`explicit_coordinates, location_field, exact_place_name, hashtag, alias,
manual, customer_ai` (the last is a reserved future value — see ADR 0006).

### OverlayLayer (`overlay_layers`)
`id, tenant_id, source_id, name, description, geometry_type,
measurement_type, unit, visibility, style_configuration, time_field,
created_at, updated_at`. One customer-uploaded dataset (e.g. "visitor
counters", "parking occupancy", "protected areas"). Belongs to a `Tenant`
and a `Source`.

### OverlayFeature (`overlay_features`)
`id, tenant_id, layer_id, geometry, observed_at, value, properties,
external_id, content_hash`. One geographic feature within a layer. Unique
on `(tenant_id, layer_id, content_hash)` for idempotent import.

## Relationships

```
Tenant 1──* Source
Tenant 1──* SocialContentItem
Tenant 1──* OverlayLayer
Source 1──* SocialContentItem
Source 1──* OverlayLayer
SocialContentItem 1──* LocationMatch
Place  1──* LocationMatch
OverlayLayer 1──* OverlayFeature
```

## Spatial types

- `Place.geometry`: generic `Geometry(GEOMETRY, srid=4326)` — points for
  mountains/lakes, polygons for municipalities, as appropriate to
  `place_type`.
- `OverlayFeature.geometry`: generic `Geometry(GEOMETRY, srid=4326)` —
  supports Point, LineString, Polygon, MultiPoint, MultiLineString,
  MultiPolygon per the uploaded GeoJSON/CSV.

Both get a GIST index automatically (via geoalchemy2's table-creation
event), ready for spatial queries (`ST_DWithin`, `ST_Contains`, etc.) if
matching/comparison logic moves off in-Python Haversine distance as data
volume grows (see ADR 0003).

## Tenant ownership summary

| Table                 | Tenant-owned? |
|------------------------|---------------|
| tenants                | n/a (is the tenant) |
| sources                | yes |
| places                 | no — shared reference gazetteer |
| social_content_items   | yes |
| location_matches       | indirectly (via social_content_item) |
| overlay_layers         | yes |
| overlay_features       | yes (denormalised `tenant_id` for direct scoping) |

## Source provenance

Every imported record traces back to exactly one `Source`, which records
`source_type`, `provider`, and `last_updated_at`. The frontend surfaces this
per-layer (source name + last-updated timestamp) so users can always see
where attention or overlay data came from, per the directive's requirement
that every layer show its source and update time.
