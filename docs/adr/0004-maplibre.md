# ADR 0004: MapLibre GL JS for the map

## Status
Accepted

## Context
The frontend needs a heatmap layer, point layers, and polygon/line overlays
with per-layer visibility/opacity/legend controls, without a commercial
mapping license.

## Decision
Use MapLibre GL JS (open-source, no API key required) with an OSM raster
basemap, rendering GeoJSON sources for the attention heatmap, social-content
points, and overlay features as native MapLibre layers (`heatmap`, `circle`,
`line`, `fill` depending on `geometry_type`).

## Consequences
- No vendor lock-in or API key management for the MVP.
- Layer styling (color ramps, opacity) is controlled entirely client-side
  through MapLibre's paint properties, driven by the small typed state
  model rather than server-rendered tiles.
- Complex cartographic styling is intentionally minimal to avoid a "complex
  design system", per the directive.
