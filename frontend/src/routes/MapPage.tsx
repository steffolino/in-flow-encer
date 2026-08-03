import { useEffect, useState } from 'react'
import { useAttention } from '../api/useAttention'
import { useComparison } from '../api/useComparison'
import { useOverlays } from '../api/useOverlays'
import { usePlaces } from '../api/usePlaces'
import { useSocialContent } from '../api/useSocialContent'
import { Header } from '../components/layout/Header'
import { DesktopLayout } from '../components/layout/DesktopLayout'
import { MobileLayout } from '../components/layout/MobileLayout'
import { MapView } from '../components/map/MapView'
import { computeDashboardSummary } from '../lib/summary'
import { useIsDesktop } from '../lib/useIsDesktop'
import { useFilters } from '../state/filters'
import { useLayers } from '../state/layers'
import { useTenant } from '../state/tenant'

export function MapPage(): React.JSX.Element {
  const { activeSlug } = useTenant()
  const { filters } = useFilters()
  const { layers } = useLayers()
  const isDesktop = useIsDesktop()
  const hasTenant = Boolean(activeSlug)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)

  // A place selected under one tenant has no meaning under another; clear it
  // whenever the active tenant changes so a stale selection can't linger.
  useEffect(() => {
    setSelectedPlaceId(null)
  }, [activeSlug])

  const attentionQuery = useAttention(filters, hasTenant)
  const comparisonQuery = useComparison(filters, hasTenant)
  const socialContentQuery = useSocialContent(filters, hasTenant)
  const overlaysQuery = useOverlays(hasTenant)
  const placesQuery = usePlaces(hasTenant)

  const cells = attentionQuery.data?.cells ?? []
  const overlays = overlaysQuery.data ?? []
  const socialItems = socialContentQuery.data?.items ?? []
  const places = placesQuery.data ?? []
  const comparisonItems = comparisonQuery.data?.items ?? []

  const summary = computeDashboardSummary(
    cells,
    socialContentQuery.data?.total ?? 0,
    overlays,
    layers,
  )

  const chromeProps = {
    cells,
    overlays,
    selectedPlaceId,
    onSelectPlace: setSelectedPlaceId,
    summary,
    comparisonItems,
    isTableLoading: hasTenant && attentionQuery.isLoading,
    isTableError: hasTenant && attentionQuery.isError,
    isComparisonLoading: hasTenant && comparisonQuery.isLoading,
    isComparisonError: hasTenant && comparisonQuery.isError,
  }

  return (
    <div className="app-shell">
      <Header />
      {!hasTenant && (
        <p className="status-message" role="status" style={{ padding: '0 1.25rem' }}>
          No tenant selected yet — pick one above. Data panels below will show their own
          loading/error states once a tenant is active.
        </p>
      )}
      <main className="app-main">
        {/* Mounted once regardless of layout, so switching between desktop/mobile
            at the breakpoint doesn't tear down and recreate the MapLibre instance. */}
        <div className="map-layer">
          <MapView
            attentionCells={cells}
            socialContentItems={socialItems}
            places={places}
            overlays={overlays}
            layers={layers}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
          />
        </div>
        {isDesktop ? <DesktopLayout {...chromeProps} /> : <MobileLayout {...chromeProps} />}
      </main>
    </div>
  )
}
