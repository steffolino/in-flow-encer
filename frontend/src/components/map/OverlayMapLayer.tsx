import type { Map as MapLibreMap } from 'maplibre-gl'
import { useOverlayFeatures } from '../../api/useOverlays'
import { overlayFeatureCollectionToGeoJSON } from '../../lib/overlayGeoJson'
import type { OverlayLayer } from '../../api/schemas'
import type { LayerState } from '../../state/layers'
import { useOverlaySync } from './useOverlaySync'

interface OverlayMapLayerProps {
  map: MapLibreMap | null
  overlay: OverlayLayer
  layerState: LayerState
}

/** Fetches one overlay's features and keeps its map layer in sync. Renders nothing itself. */
export function OverlayMapLayer({ map, overlay, layerState }: OverlayMapLayerProps): null {
  const { data } = useOverlayFeatures(overlay.id, true)
  const geoJson = data ? overlayFeatureCollectionToGeoJSON(data) : undefined
  useOverlaySync(map, overlay.id, overlay.geometry_type, geoJson, layerState)
  return null
}
