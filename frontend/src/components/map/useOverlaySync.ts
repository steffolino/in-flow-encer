import { useEffect } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { FeatureCollection, Geometry } from 'geojson'
import { OVERLAY_GEOMETRY_COLORS } from '../../lib/colors'
import { setGeoJsonSourceData } from '../../lib/mapSourceUtil'
import type { OverlayFeatureProperties, OverlayGeometryType } from '../../api/schemas'
import type { LayerState } from '../../state/layers'

function layerIdFor(overlayId: string): string {
  return `overlay-${overlayId}`
}
function sourceIdFor(overlayId: string): string {
  return `overlay-source-${overlayId}`
}

/**
 * Syncs a single uploaded overlay layer onto the map. Geometry-type
 * dictates the maplibre layer type so points/lines/polygons each get their
 * own distinct, cool-toned styling (never the warm attention ramp).
 */
export function useOverlaySync(
  map: MapLibreMap | null,
  overlayId: string,
  geometryType: OverlayGeometryType,
  data: FeatureCollection<Geometry, OverlayFeatureProperties> | undefined,
  layerState: LayerState,
): void {
  const sourceId = sourceIdFor(overlayId)
  const layerId = layerIdFor(overlayId)
  const color = OVERLAY_GEOMETRY_COLORS[geometryType]

  useEffect(() => {
    if (!map || !data) return

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: 'geojson', data })

      if (geometryType === 'Point') {
        map.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 6,
            'circle-color': color,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-opacity': layerState.opacity,
            'circle-stroke-opacity': layerState.opacity,
          },
          layout: { visibility: layerState.visible ? 'visible' : 'none' },
        })
      } else if (geometryType === 'LineString') {
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': color,
            'line-width': 3,
            'line-opacity': layerState.opacity,
          },
          layout: { visibility: layerState.visible ? 'visible' : 'none' },
        })
      } else {
        map.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': color,
            'fill-opacity': layerState.opacity * 0.55,
            'fill-outline-color': color,
          },
          layout: { visibility: layerState.visible ? 'visible' : 'none' },
        })
      }
    } else {
      setGeoJsonSourceData(map, sourceId, data)
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- layer created once per (map, overlay); style/data handled below
  }, [map, sourceId, layerId, geometryType])

  useEffect(() => {
    if (!map || !data) return
    setGeoJsonSourceData(map, sourceId, data)
  }, [map, sourceId, data])

  useEffect(() => {
    if (!map?.getLayer(layerId)) return
    const opacityProp =
      geometryType === 'Point' ? 'circle-opacity' : geometryType === 'LineString' ? 'line-opacity' : 'fill-opacity'
    const opacityValue = geometryType === 'Polygon' ? layerState.opacity * 0.55 : layerState.opacity
    map.setPaintProperty(layerId, opacityProp, opacityValue)
    if (geometryType === 'Point') {
      map.setPaintProperty(layerId, 'circle-stroke-opacity', layerState.opacity)
    }
    map.setLayoutProperty(layerId, 'visibility', layerState.visible ? 'visible' : 'none')
  }, [map, layerId, geometryType, layerState.opacity, layerState.visible])
}
