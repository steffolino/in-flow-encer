# ADR 0004: MapLibre GL JS for the map

## Status
Accepted

## Context
The frontend needs a heatmap layer, point layers, and polygon/line overlays
with per-layer visibility/opacity/legend controls, without a commercial
mapping license.

## Decision
Use MapLibre GL JS (open-source, no API key required) with a keyless
basemap, rendering GeoJSON sources for the attention heatmap, social-content
points, and overlay features as native MapLibre layers (`heatmap`, `circle`,
`line`, `fill` depending on `geometry_type`).

Basemap tiles come from CARTO's free "Positron" / "Dark Matter" vector GL
styles (built on OpenStreetMap data), fetched directly from CARTO's
`style.json` URLs — same no-API-key, no-vendor-lock-in deal as stock OSM
raster tiles, but a deliberately muted, low-contrast style so the app's own
attention/forecast/overlay markers read clearly instead of competing with
OSM's default style's dense road/POI iconography. `frontend/src/lib/mapStyle.ts`
has the full rationale, including why this is a vector style rather than a
custom raster one: CARTO discontinued free anonymous access to its legacy
raster tile CDN (`a/b/c/d.basemaps.cartocdn.com`), which now serves
watermarked "API KEY REQUIRED" placeholder tiles instead of real map imagery.

Our own symbol layers with `text-field` labels (e.g. attention marker
labels) render using a font (`Open Sans Bold`) served by these styles' own
glyphs endpoint, since a MapLibre style has one glyphs URL for the whole
map. This does not change the basemap decision: tiles are still keyless and
no commercial API key is required.

## Consequences
- No vendor lock-in or API key management for the MVP.
- Layer styling (color ramps, opacity) is controlled entirely client-side
  through MapLibre's paint properties, driven by the small typed state
  model rather than server-rendered tiles.
- Complex cartographic styling is intentionally minimal to avoid a "complex
  design system", per the directive.
