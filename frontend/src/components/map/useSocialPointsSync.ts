import { useEffect } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { FeatureCollection, Point } from 'geojson'
import { SOCIAL_POINT_COLOR } from '../../lib/colors'
import { setGeoJsonSourceData } from '../../lib/mapSourceUtil'
import type { SocialPointProperties } from '../../lib/mapLayers'
import type { LayerState } from '../../state/layers'

const SOURCE_ID = 'social-points-source'
const LAYER_ID = 'social-points-layer'

/**
 * Optional point view of individual social-content items, placed at their
 * highest-confidence matched place. Rendered as small solid circles so it
 * stays visually distinct from both the attention heatmap and overlays.
 */
export function useSocialPointsSync(
  map: MapLibreMap | null,
  data: FeatureCollection<Point, SocialPointProperties>,
  layerState: LayerState,
  isDarkBasemap = false,
  styleRevision = 0,
): void {
  useEffect(() => {
    if (!map || styleRevision === 0 || !map.isStyleLoaded()) return

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'geojson', data })
      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': 5,
          'circle-color': SOCIAL_POINT_COLOR,
          'circle-stroke-color': isDarkBasemap ? '#111827' : '#ffffff',
          'circle-stroke-width': 1,
          'circle-opacity': layerState.opacity,
          'circle-stroke-opacity': layerState.opacity,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- layer is created once per loaded basemap style; data/visibility handled below
  }, [map, isDarkBasemap, styleRevision])

  useEffect(() => {
    if (!map?.getLayer(LAYER_ID)) return
    map.setPaintProperty(LAYER_ID, 'circle-opacity', layerState.opacity)
    map.setPaintProperty(LAYER_ID, 'circle-stroke-opacity', layerState.opacity)
    map.setLayoutProperty(LAYER_ID, 'visibility', layerState.visible ? 'visible' : 'none')
  }, [map, layerState.opacity, layerState.visible])

  useEffect(() => {
    if (!map) return
    setGeoJsonSourceData(map, SOURCE_ID, data)
  }, [map, data])
}
