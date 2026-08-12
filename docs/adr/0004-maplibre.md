# ADR 0004: MapLibre GL JS for the map

## Status
Accepted

## Context
The frontend needs a heatmap layer, point layers, and polygon/line overlays
with per-layer visibility/opacity/legend controls, without a commercial
mapping license.

## Decision
Use MapLibre GL JS (open-source, no API key required) with a keyless raster
basemap, rendering GeoJSON sources for the attention heatmap, social-content
points, and overlay features as native MapLibre layers (`heatmap`, `circle`,
`line`, `fill` depending on `geometry_type`).

Basemap tiles come from CARTO's free "Positron" raster style (built on
OpenStreetMap data), not stock OSM raster tiles — same no-API-key, no-vendor-
lock-in deal, but a deliberately muted, low-contrast style so the app's own
attention/forecast/overlay markers read clearly instead of competing with
OSM's default style's dense road/POI iconography. `frontend/src/lib/mapStyle.ts`
has the full rationale.

The style also includes MapLibre's public demo glyph endpoint so symbol
layers with `text-field` labels (e.g. attention marker labels) can render.
This does not change the basemap decision: tiles are still a keyless raster
source and no commercial API key is required.

## Consequences
- No vendor lock-in or API key management for the MVP.
- Layer styling (color ramps, opacity) is controlled entirely client-side
  through MapLibre's paint properties, driven by the small typed state
  model rather than server-rendered tiles.
- Complex cartographic styling is intentionally minimal to avoid a "complex
  design system", per the directive.
