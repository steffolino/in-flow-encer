import { useEffect, useRef, useState } from 'react'
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BASEMAP_STYLE, BAVARIAN_ALPS_CENTER, DEFAULT_ZOOM } from '../../lib/mapStyle'
import { attentionCellsToGeoJSON, socialContentToGeoJSON } from '../../lib/mapLayers'
import type { AttentionCell, OverlayLayer, Place, SocialContentItem } from '../../api/schemas'
import { ATTENTION_HEATMAP_LAYER_ID, SOCIAL_POINTS_LAYER_ID, type LayersState } from '../../state/layers'
import { useAttentionHeatmapSync } from './useAttentionHeatmapSync'
import { useSocialPointsSync } from './useSocialPointsSync'
import { OverlayMapLayer } from './OverlayMapLayer'
import { defaultLayerState } from '../../state/layers'
import { useTenant } from '../../state/tenant'

interface MapViewProps {
  attentionCells: AttentionCell[]
  socialContentItems: SocialContentItem[]
  places: Place[]
  overlays: OverlayLayer[]
  layers: LayersState
}

export function MapView({
  attentionCells,
  socialContentItems,
  places,
  overlays,
  layers,
}: MapViewProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const { activeSlug } = useTenant()
  const fittedTenantRef = useRef<string | null>(null)

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

  const attentionData = attentionCellsToGeoJSON(attentionCells)
  const socialData = socialContentToGeoJSON(socialContentItems, places)

  useAttentionHeatmapSync(
    map,
    attentionData,
    layers[ATTENTION_HEATMAP_LAYER_ID] ?? defaultLayerState(),
  )
  useSocialPointsSync(map, socialData, layers[SOCIAL_POINTS_LAYER_ID] ?? defaultLayerState())

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
