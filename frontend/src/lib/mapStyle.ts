export type BasemapScheme = 'light' | 'dark'

/**
 * CARTO's published vector GL styles (Positron / Dark Matter), fetched
 * directly by MapLibre from their style.json URLs. These require no API
 * key. CARTO's older raster tile CDN (a/b/c/d.basemaps.cartocdn.com/*.png)
 * has since been locked down to watermarked "API KEY REQUIRED" tiles for
 * anonymous requests, which is why we no longer build a custom raster
 * style around it. Our own attention, forecast, and overlay layers sit
 * above whichever style is active; their label layers use a font
 * (`Open Sans Bold`) served by CARTO's own glyphs endpoint, since these
 * styles' `glyphs` field points there rather than at demotiles.maplibre.org.
 */
export const BASEMAP_STYLES: Record<BasemapScheme, string> = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
}

export const BAVARIAN_ALPS_CENTER: [number, number] = [11.09, 47.49]
export const DEFAULT_ZOOM = 9
