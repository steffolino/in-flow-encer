import type { StyleSpecification } from 'maplibre-gl'

/**
 * Minimal raster basemap so the app runs without a vector-tile provider API
 * key. Swappable for a hosted vector style later without touching any
 * layer-sync code, since attention/overlay layers are added on top of
 * whatever base style is loaded.
 *
 * Tiles are CARTO's free "Positron" raster style (built on OpenStreetMap
 * data) rather than the stock OSM raster tiles: same no-API-key, no-vendor-
 * lock-in deal as ADR 0004 requires, but a deliberately muted, low-contrast
 * basemap so our own attention/forecast/overlay markers — which carry the
 * actual meaning — read clearly instead of competing with OSM's default
 * style's dense road/POI iconography.
 */
export const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  // Required for MapLibre symbol layers such as the attention marker labels.
  // The basemap remains raster and keyless; glyphs only provide fonts for
  // our own GeoJSON label layers.
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    basemap: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: 'basemap',
      type: 'raster',
      source: 'basemap',
    },
  ],
}

export const BAVARIAN_ALPS_CENTER: [number, number] = [11.09, 47.49]
export const DEFAULT_ZOOM = 9
