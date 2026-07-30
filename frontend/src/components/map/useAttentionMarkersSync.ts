import { useEffect, useRef } from 'react'
import {
  Popup,
  type Map as MapLibreMap,
  type MapGeoJSONFeature,
  type MapMouseEvent,
} from 'maplibre-gl'
import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec'
import type { FeatureCollection, Point } from 'geojson'
import {
  ATTENTION_MARKER_COLOR_EXPRESSION,
  ATTENTION_MARKER_RADIUS_EXPRESSION,
  ATTENTION_MARKER_SELECTED_STROKE,
  ATTENTION_MARKER_STROKE,
} from '../../lib/colors'
import { setGeoJsonSourceData } from '../../lib/mapSourceUtil'
import { formatCompactNumber, formatInteger } from '../../lib/format'
import type { AttentionPointProperties } from '../../lib/mapLayers'
import type { LayerState } from '../../state/layers'

const SOURCE_ID = 'attention-markers-source'
const CIRCLE_LAYER_ID = 'attention-markers-circle-layer'
const LABEL_LAYER_ID = 'attention-markers-label-layer'

function selectedStrokeExpression(selectedPlaceId: string | null): ExpressionSpecification {
  return [
    'case',
    ['==', ['get', 'place_id'], selectedPlaceId ?? '__none__'],
    ATTENTION_MARKER_SELECTED_STROKE,
    ATTENTION_MARKER_STROKE,
  ]
}

function selectedStrokeWidthExpression(selectedPlaceId: string | null): ExpressionSpecification {
  return ['case', ['==', ['get', 'place_id'], selectedPlaceId ?? '__none__'], 4, 2]
}

/**
 * The primary, legible attention signal: a bold circle per place, sized and
 * colored by attention_score, always labeled with the place name. This is
 * deliberately more prominent than the heatmap layer underneath it (which is
 * too diffuse to read on its own with only a handful of gazetteer places).
 * Clicking a marker opens a popup and reports the place back up via
 * onSelectPlace, so the map and the results table can drive each other.
 */
export function useAttentionMarkersSync(
  map: MapLibreMap | null,
  data: FeatureCollection<Point, AttentionPointProperties>,
  layerState: LayerState,
  selectedPlaceId: string | null,
  onSelectPlace: (placeId: string) => void,
): void {
  const popupRef = useRef<Popup | null>(null)
  const onSelectPlaceRef = useRef(onSelectPlace)
  onSelectPlaceRef.current = onSelectPlace

  useEffect(() => {
    if (!map) return

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'geojson', data })
      map.addLayer({
        id: CIRCLE_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': ATTENTION_MARKER_RADIUS_EXPRESSION,
          'circle-color': ATTENTION_MARKER_COLOR_EXPRESSION,
          'circle-stroke-color': selectedStrokeExpression(null),
          'circle-stroke-width': selectedStrokeWidthExpression(null),
          'circle-opacity': layerState.opacity,
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
          'text-color': '#1c1917',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.4,
          'text-opacity': layerState.opacity,
        },
        layout: {
          'text-field': ['get', 'place_name'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 13,
          'text-offset': [0, 1.6],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          visibility: layerState.visible ? 'visible' : 'none',
        },
      })

      const handleClick = (
        event: MapMouseEvent & { features?: MapGeoJSONFeature[] },
      ): void => {
        const feature = event.features?.[0]
        if (!feature || feature.geometry.type !== 'Point') return
        const props = feature.properties as AttentionPointProperties
        onSelectPlaceRef.current(props.place_id)

        popupRef.current?.remove()
        const coordinates = feature.geometry.coordinates
        popupRef.current = new Popup({ closeButton: true, offset: 12 })
          .setLngLat([coordinates[0] ?? 0, coordinates[1] ?? 0])
          .setHTML(
            `<strong>${props.place_name}</strong><br/>` +
              `Attention score: ${props.attention_score.toFixed(2)}<br/>` +
              `${formatInteger(props.post_count)} posts · ${formatCompactNumber(props.total_reach)} reach · ` +
              `${formatCompactNumber(props.total_engagement)} engagement`,
          )
          .addTo(map)
      }
      const handleMouseEnter = (): void => {
        map.getCanvas().style.cursor = 'pointer'
      }
      const handleMouseLeave = (): void => {
        map.getCanvas().style.cursor = ''
      }

      map.on('click', CIRCLE_LAYER_ID, handleClick)
      map.on('mouseenter', CIRCLE_LAYER_ID, handleMouseEnter)
      map.on('mouseleave', CIRCLE_LAYER_ID, handleMouseLeave)
    } else {
      setGeoJsonSourceData(map, SOURCE_ID, data)
    }

    return () => {
      if (map.getLayer(LABEL_LAYER_ID)) map.removeLayer(LABEL_LAYER_ID)
      if (map.getLayer(CIRCLE_LAYER_ID)) map.removeLayer(CIRCLE_LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      popupRef.current?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- layer created once per map instance; data/visibility/selection handled below
  }, [map])

  useEffect(() => {
    if (!map?.getLayer(CIRCLE_LAYER_ID)) return
    map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-opacity', layerState.opacity)
    map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-stroke-opacity', layerState.opacity)
    map.setLayoutProperty(CIRCLE_LAYER_ID, 'visibility', layerState.visible ? 'visible' : 'none')
    map.setPaintProperty(LABEL_LAYER_ID, 'text-opacity', layerState.opacity)
    map.setLayoutProperty(LABEL_LAYER_ID, 'visibility', layerState.visible ? 'visible' : 'none')
  }, [map, layerState.opacity, layerState.visible])

  useEffect(() => {
    if (!map?.getLayer(CIRCLE_LAYER_ID)) return
    map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-stroke-color', selectedStrokeExpression(selectedPlaceId))
    map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-stroke-width', selectedStrokeWidthExpression(selectedPlaceId))
  }, [map, selectedPlaceId])

  useEffect(() => {
    if (!map) return
    setGeoJsonSourceData(map, SOURCE_ID, data)
  }, [map, data])
}
