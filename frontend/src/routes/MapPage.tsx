import { useEffect, useState } from 'react'
import { useAttention } from '../api/useAttention'
import { useComparison } from '../api/useComparison'
import { useOverlays } from '../api/useOverlays'
import { usePlaces } from '../api/usePlaces'
import { useSocialContent } from '../api/useSocialContent'
import { Header } from '../components/layout/Header'
import { FilterPanel } from '../components/filters/FilterPanel'
import { LayerControls } from '../components/layers/LayerControls'
import { MapView } from '../components/map/MapView'
import { ComparisonPanel } from '../components/summary/ComparisonPanel'
import { ResultsTable } from '../components/summary/ResultsTable'
import { SummaryStrip } from '../components/summary/SummaryStrip'
import { OverlayUpload } from '../components/import/OverlayUpload'
import { SocialContentImport } from '../components/import/SocialContentImport'
import { computeDashboardSummary } from '../lib/summary'
import { useFilters } from '../state/filters'
import { useLayers } from '../state/layers'
import { useTenant } from '../state/tenant'

export function MapPage(): React.JSX.Element {
  const { activeSlug } = useTenant()
  const { filters } = useFilters()
  const { layers } = useLayers()
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
        <div className="sidebar-left">
          <FilterPanel />
          <LayerControls overlays={overlays} />
        </div>

        <div className="map-column">
          <MapView
            attentionCells={cells}
            socialContentItems={socialItems}
            places={places}
            overlays={overlays}
            layers={layers}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
          />
          <SummaryStrip summary={summary} />
          <ResultsTable
            cells={cells}
            isLoading={hasTenant && attentionQuery.isLoading}
            isError={hasTenant && attentionQuery.isError}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
          />
        </div>

        <div className="sidebar-right">
          <ComparisonPanel
            items={comparisonItems}
            isLoading={hasTenant && comparisonQuery.isLoading}
            isError={hasTenant && comparisonQuery.isError}
          />
          <SocialContentImport />
          <OverlayUpload />
        </div>
      </main>
    </div>
  )
}
