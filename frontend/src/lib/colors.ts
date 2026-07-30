/**
 * Color ramps and legend descriptions.
 *
 * Social attention (inferred/observational) always uses a warm ramp.
 * Uploaded/administrative overlays always use cool, saturated,
 * geometry-specific colors. The two families are chosen to look
 * unmistakably different at a glance, and every legend entry carries a
 * text label so nothing is color-only.
 */
import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec'
import type { OverlayGeometryType } from '../api/schemas'

export interface LegendStop {
  color: string
  label: string
}

/**
 * Warm ramp for the soft heatmap "glow" layer, low -> high density. This
 * layer is deliberately secondary now — with only a handful of gazetteer
 * places, a diffuse kernel-density heatmap alone is illegible (each point
 * barely overlaps its neighbours). The real, readable signal is the
 * graduated marker+label layer below; the heatmap just adds ambient warmth
 * under it.
 */
export const ATTENTION_HEATMAP_COLOR_EXPRESSION: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0,
  'rgba(255, 247, 188, 0)',
  0.2,
  'rgba(254, 217, 118, 0.75)',
  0.4,
  'rgba(253, 141, 60, 0.85)',
  0.7,
  'rgba(227, 26, 28, 0.9)',
  1,
  'rgba(128, 0, 38, 0.95)',
]

/** Marker circle radius (px) interpolated by normalised attention_score (0..1). */
export const ATTENTION_MARKER_RADIUS_EXPRESSION: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['coalesce', ['get', 'attention_score'], 0],
  0,
  10,
  0.5,
  18,
  1,
  28,
]

/** Marker fill color interpolated by normalised attention_score (0..1). */
export const ATTENTION_MARKER_COLOR_EXPRESSION: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['coalesce', ['get', 'attention_score'], 0],
  0,
  '#fde68a',
  0.4,
  '#fb923c',
  0.7,
  '#dc2626',
  1,
  '#7f1d1d',
]

export const ATTENTION_MARKER_SELECTED_STROKE = '#1d4ed8'
export const ATTENTION_MARKER_STROKE = '#ffffff'

export const ATTENTION_LEGEND_STOPS: LegendStop[] = [
  { color: 'rgba(254, 217, 118, 0.85)', label: 'Low attention' },
  { color: 'rgba(253, 141, 60, 0.85)', label: 'Moderate attention' },
  { color: 'rgba(227, 26, 28, 0.9)', label: 'High attention' },
  { color: 'rgba(128, 0, 38, 0.95)', label: 'Very high attention' },
]

export const SOCIAL_POINT_COLOR = '#b91c1c'

/** Cool, geometry-specific colors for customer-supplied overlay layers. */
export const OVERLAY_GEOMETRY_COLORS: Record<OverlayGeometryType, string> = {
  Point: '#0e7490',
  LineString: '#4338ca',
  Polygon: '#7c3aed',
}

export const OVERLAY_GEOMETRY_LABELS: Record<OverlayGeometryType, string> = {
  Point: 'Point markers (circle icon)',
  LineString: 'Line route (line icon)',
  Polygon: 'Area / polygon (filled shape icon)',
}
