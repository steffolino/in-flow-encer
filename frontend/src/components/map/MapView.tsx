import { useEffect, useRef, useState } from 'react'
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BASEMAP_STYLE, BAVARIAN_ALPS_CENTER, DEFAULT_ZOOM } from '../../lib/mapStyle'
import { attentionCellsToGeoJSON, forecastCellsToGeoJSON, socialContentToGeoJSON } from '../../lib/mapLayers'
import type { AttentionCell, ForecastCell, OverlayLayer, Place, SocialContentItem } from '../../api/schemas'
import {
  ATTENTION_HEATMAP_LAYER_ID,
  FORECAST_LAYER_ID,
  SOCIAL_POINTS_LAYER_ID,
  type LayersState,
} from '../../state/layers'
import { useAttentionHeatmapSync } from './useAttentionHeatmapSync'
import { useAttentionMarkersSync } from './useAttentionMarkersSync'
import { useForecastMarkersSync } from './useForecastMarkersSync'
import { useSocialPointsSync } from './useSocialPointsSync'
import { OverlayMapLayer } from './OverlayMapLayer'
import { defaultLayerState } from '../../state/layers'
import { useTenant } from '../../state/tenant'

interface MapViewProps {
  attentionCells: AttentionCell[]
  forecastCells: ForecastCell[]
  socialContentItems: SocialContentItem[]
  places: Place[]
  overlays: OverlayLayer[]
  layers: LayersState
  selectedPlaceId: string | null
  onSelectPlace: (placeId: string) => void
}

export function MapView({
  attentionCells,
  forecastCells,
  socialContentItems,
  places,
  overlays,
  layers,
  selectedPlaceId,
  onSelectPlace,
}: MapViewProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const { activeSlug } = useTenant()
  const fittedTenantRef = useRef<string | null>(null)

  // Fly to the active tenant's own places once its data has loaded, instead
  // of always showing the fixed Bavarian Alps overview. Runs once per tenant
  // switch (tracked via fittedTenantRef), not on every filter/data refresh,
  // so it doesn't yank the view back while a user is panning around.
  useEffect(() => {
    if (!map || !activeSlug) return
    if (fittedTenantRef.current === activeSlug) return
    if (attentionCells.length === 0) return

    const bounds = new maplibregl.LngLatBounds()
    for (const cell of attentionCells) {
      bounds.extend([cell.lon, cell.lat])
    }
    map.fitBounds(bounds, { padding: 80, maxZoom: 12, duration: 800 })
    fittedTenantRef.current = activeSlug
  }, [map, activeSlug, attentionCells])

  // Selecting a place (via a marker click or a results-table row) flies the
  // map to it, so the table and the map drive each other instead of being
  // two disconnected views of the same data.
  useEffect(() => {
    if (!map || !selectedPlaceId) return
    const cell = attentionCells.find((c) => c.place_id === selectedPlaceId)
    if (!cell) return
    map.flyTo({ center: [cell.lon, cell.lat], zoom: Math.max(map.getZoom(), 11), duration: 600 })
  }, [map, selectedPlaceId, attentionCells])

  const attentionData = attentionCellsToGeoJSON(attentionCells)
  const forecastData = forecastCellsToGeoJSON(forecastCells)
  const socialData = socialContentToGeoJSON(socialContentItems, places)

  useAttentionHeatmapSync(
    map,
    attentionData,
    layers[ATTENTION_HEATMAP_LAYER_ID] ?? defaultLayerState(),
  )
  useAttentionMarkersSync(
    map,
    attentionData,
    layers[ATTENTION_HEATMAP_LAYER_ID] ?? defaultLayerState(),
    selectedPlaceId,
    onSelectPlace,
  )
  useForecastMarkersSync(map, forecastData, layers[FORECAST_LAYER_ID] ?? defaultLayerState())
  useSocialPointsSync(map, socialData, layers[SOCIAL_POINTS_LAYER_ID] ?? defaultLayerState())

  // Declared last (not first) on purpose: React unmounts effects for a given
  // component in the order they were set up, so this must be the LAST effect
  // to have a cleanup function here. Each use*Sync hook above registers its
  // own layer-removal cleanup; if this map-teardown effect ran first (as it
  // did when declared at the top of the component), instance.remove() would
  // destroy the map before those hooks' cleanups call map.getLayer/removeLayer
  // on it, throwing "Cannot read properties of undefined" on every route
  // change away from the map (see the About-page navigation bug).
  useEffect(() => {
    if (!containerRef.current) return

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: BAVARIAN_ALPS_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    })
    instance.addControl(new maplibregl.NavigationControl(), 'top-right')
    instance.addControl(new maplibregl.AttributionControl({ compact: true }))
    mapRef.current = instance
    instance.on('load', () => {
      setMap(instance)
    })

    return () => {
      instance.remove()
      mapRef.current = null
      setMap(null)
    }
  }, [])

  return (
    <div
      className="map-container"
      ref={containerRef}
      role="region"
      aria-label="Map of social attention and visitor-flow overlays across the Bavarian Alps"
    >
      {overlays.map((overlay) => (
        <OverlayMapLayer
          key={overlay.id}
          map={map}
          overlay={overlay}
          layerState={layers[overlay.id] ?? defaultLayerState()}
        />
      ))}
    </div>
  )
}
