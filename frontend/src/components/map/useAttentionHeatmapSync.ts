import { useEffect } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { FeatureCollection, Point } from 'geojson'
import { ATTENTION_HEATMAP_COLOR_EXPRESSION } from '../../lib/colors'
import { setGeoJsonSourceData } from '../../lib/mapSourceUtil'
import type { AttentionPointProperties } from '../../lib/mapLayers'
import type { LayerState } from '../../state/layers'

const SOURCE_ID = 'attention-source'
const LAYER_ID = 'attention-heatmap-layer'

/**
 * Adds (once) and keeps in sync the social-attention heatmap layer. The
 * heatmap uses `attention_score` as its weight and a warm color ramp,
 * visually distinct from overlay layers by design (see lib/colors.ts).
 */
export function useAttentionHeatmapSync(
  map: MapLibreMap | null,
  data: FeatureCollection<Point, AttentionPointProperties>,
  layerState: LayerState,
): void {
  useEffect(() => {
    if (!map) return

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'geojson', data })
      map.addLayer({
        id: LAYER_ID,
        type: 'heatmap',
        source: SOURCE_ID,
        paint: {
          // Boosted (x3) so a handful of sparse places still register instead
          // of washing out — see lib/colors.ts for why this is a secondary
          // "glow" layer, not the primary readable signal.
          'heatmap-weight': ['coalesce', ['*', ['get', 'attention_score'], 3], 0],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 6, 1.5, 14, 3.5],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 6, 25, 14, 70],
          'heatmap-color': ATTENTION_HEATMAP_COLOR_EXPRESSION,
          'heatmap-opacity': layerState.opacity * 0.7,
        },
        layout: {
          visibility: layerState.visible ? 'visible' : 'none',
        },
      })
    } else {
      setGeoJsonSourceData(map, SOURCE_ID, data)
    }

    return () => {
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- layer created once per map instance; data/visibility handled below
  }, [map])

  useEffect(() => {
    if (!map?.getLayer(LAYER_ID)) return
    map.setPaintProperty(LAYER_ID, 'heatmap-opacity', layerState.opacity * 0.7)
    map.setLayoutProperty(LAYER_ID, 'visibility', layerState.visible ? 'visible' : 'none')
  }, [map, layerState.opacity, layerState.visible])

  useEffect(() => {
    if (!map) return
    setGeoJsonSourceData(map, SOURCE_ID, data)
  }, [map, data])
}
