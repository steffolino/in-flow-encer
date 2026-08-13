import type { StyleSpecification } from 'maplibre-gl'

type CartoBasemap = 'light_all' | 'dark_all'
export type BasemapScheme = 'light' | 'dark'

function cartoRasterStyle(basemap: CartoBasemap): StyleSpecification {
  return {
    version: 8,
    // Required for MapLibre symbol layers such as the attention marker labels.
    // The basemap remains raster and keyless; glyphs only provide fonts for
    // our own GeoJSON label layers.
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      basemap: {
        type: 'raster',
        tiles: [
          `https://a.basemaps.cartocdn.com/${basemap}/{z}/{x}/{y}{r}.png`,
          `https://b.basemaps.cartocdn.com/${basemap}/{z}/{x}/{y}{r}.png`,
          `https://c.basemaps.cartocdn.com/${basemap}/{z}/{x}/{y}{r}.png`,
          `https://d.basemaps.cartocdn.com/${basemap}/{z}/{x}/{y}{r}.png`,
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
}

/**
 * Minimal raster basemaps so the app runs without a vector-tile provider API
 * key. CARTO's Positron light tiles and Dark Matter dark tiles are both
 * OpenStreetMap-based, keyless raster styles; our own attention, forecast,
 * and overlay layers sit above whichever style is active.
 */
export const BASEMAP_STYLES: Record<BasemapScheme, StyleSpecification> = {
  light: cartoRasterStyle('light_all'),
  dark: cartoRasterStyle('dark_all'),
}

export const BASEMAP_STYLE = BASEMAP_STYLES.light
export const BAVARIAN_ALPS_CENTER: [number, number] = [11.09, 47.49]
export const DEFAULT_ZOOM = 9
