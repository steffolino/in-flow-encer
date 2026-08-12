import { useEffect } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { FeatureCollection, Point } from 'geojson'
import { FORECAST_MARKER_COLOR_EXPRESSION } from '../../lib/colors'
import { setGeoJsonSourceData } from '../../lib/mapSourceUtil'
import type { ForecastPointProperties } from '../../lib/mapLayers'
import type { LayerState } from '../../state/layers'

const SOURCE_ID = 'forecast-source'
const CIRCLE_LAYER_ID = 'forecast-circle-layer'
const LABEL_LAYER_ID = 'forecast-label-layer'

/**
 * Adds (once) and keeps in sync the forecast layer: a translucent circle
 * per place, sized/colored by forecast_score, using the violet/blue "this is
 * a projection, not an observation" color family (see lib/colors.ts), a
 * lower fill opacity than the attention markers, and a "~"-prefixed label so
 * it never reads as a measured value. Off by default (see state/layers.ts)
 * since it's a secondary, opt-in view.
 */
export function useForecastMarkersSync(
  map: MapLibreMap | null,
  data: FeatureCollection<Point, ForecastPointProperties>,
  layerState: LayerState,
): void {
  useEffect(() => {
    if (!map) return

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'geojson', data })
      map.addLayer({
        id: CIRCLE_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'forecast_score'], 0],
            0,
            8,
            0.5,
            15,
            1,
            24,
          ],
          'circle-color': FORECAST_MARKER_COLOR_EXPRESSION,
          'circle-stroke-color': '#065f46',
          'circle-stroke-width': 2,
          'circle-opacity': layerState.opacity * 0.6,
          'circle-stroke-opacity': layerState.opacity,
        },
        layout: {
          visibility: layerState.visible ? 'visible' : 'none',
        },
      })
      map.addLayer({
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        paint: {
          'text-color': '#065f46',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.4,
          'text-opacity': layerState.opacity,
        },
        layout: {
          'text-field': ['concat', '~', ['to-string', ['get', 'forecast_score']]],
          'text-font': ['Noto Sans Bold'],
          'text-size': 11,
          'text-offset': [0, -1.6],
          'text-anchor': 'bottom',
          'text-allow-overlap': false,
          visibility: layerState.visible ? 'visible' : 'none',
        },
      })
    } else {
      setGeoJsonSourceData(map, SOURCE_ID, data)
    }

    return () => {
      if (map.getLayer(LABEL_LAYER_ID)) map.removeLayer(LABEL_LAYER_ID)
      if (map.getLayer(CIRCLE_LAYER_ID)) map.removeLayer(CIRCLE_LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- layers created once per map instance; data/visibility handled below
  }, [map])

  useEffect(() => {
    if (!map?.getLayer(CIRCLE_LAYER_ID)) return
    map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-opacity', layerState.opacity * 0.6)
    map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-stroke-opacity', layerState.opacity)
    map.setLayoutProperty(CIRCLE_LAYER_ID, 'visibility', layerState.visible ? 'visible' : 'none')
    map.setPaintProperty(LABEL_LAYER_ID, 'text-opacity', layerState.opacity)
    map.setLayoutProperty(LABEL_LAYER_ID, 'visibility', layerState.visible ? 'visible' : 'none')
  }, [map, layerState.opacity, layerState.visible])

  useEffect(() => {
    if (!map) return
    setGeoJsonSourceData(map, SOURCE_ID, data)
  }, [map, data])
}
