import type { StyleSpecification } from 'maplibre-gl'

/**
 * Minimal raster basemap (OpenStreetMap tiles) so the app runs without a
 * vector-tile provider API key. Swappable for a hosted vector style later
 * without touching any layer-sync code, since attention/overlay layers are
 * added on top of whatever base style is loaded.
 */
export const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
}

export const BAVARIAN_ALPS_CENTER: [number, number] = [11.09, 47.49]
export const DEFAULT_ZOOM = 9
