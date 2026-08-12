import { FilterPanel } from '../filters/FilterPanel'
import { TimeRangeSlider } from '../filters/TimeRangeSlider'
import { LayerControls } from '../layers/LayerControls'
import { ComparisonPanel } from '../summary/ComparisonPanel'
import { ForecastPanel } from '../summary/ForecastPanel'
import { ResultsTable } from '../summary/ResultsTable'
import { OverlayUpload } from '../import/OverlayUpload'
import { SocialContentImport } from '../import/SocialContentImport'
import { useUI, type MobileSheetId } from '../../state/ui'
import { MobileSheet } from './MobileSheet'
import type { AttentionCell, ForecastCell, OverlayLayer, ComparisonItem } from '../../api/schemas'
import type { DashboardSummary } from '../../lib/summary'

interface MobileLayoutProps {
  cells: AttentionCell[]
  overlays: OverlayLayer[]
  selectedPlaceId: string | null
  onSelectPlace: (placeId: string) => void
  summary: DashboardSummary
  comparisonItems: ComparisonItem[]
  forecastCells: ForecastCell[]
  forecastNotYetConnected: string[]
  isTableLoading: boolean
  isTableError: boolean
  isComparisonLoading: boolean
  isComparisonError: boolean
  isForecastLoading: boolean
  isForecastError: boolean
}

const MENU_ITEMS: { id: MobileSheetId; label: string }[] = [
  { id: 'filters', label: 'Filters' },
  { id: 'layers', label: 'Map layers' },
  { id: 'table', label: 'Places table' },
  { id: 'forecast', label: 'Forecast & drivers' },
  { id: 'comparison', label: 'Compare to visitor flow' },
  { id: 'import', label: 'Import data' },
]

const SHEET_TITLES: Record<MobileSheetId, string> = {
  filters: 'Filters',
  layers: 'Map layers',
  table: 'Places table',
  forecast: 'Forecast & drivers',
  comparison: 'Compare to visitor flow',
  import: 'Import data',
}

export function MobileLayout({
  cells,
  overlays,
  selectedPlaceId,
  onSelectPlace,
  summary,
  comparisonItems,
  forecastCells,
  forecastNotYetConnected,
  isTableLoading,
  isTableError,
  isComparisonLoading,
  isComparisonError,
  isForecastLoading,
  isForecastError,
}: MobileLayoutProps): React.JSX.Element {
  const { ui, dispatch } = useUI()

  const openMenu = () => { dispatch({ type: 'OPEN_MOBILE_MENU' }); }
  const openSheet = (panel: MobileSheetId) => { dispatch({ type: 'OPEN_MOBILE_SHEET', panel }); }
  const closeSheet = () => { dispatch({ type: 'CLOSE_MOBILE_SHEET' }); }

  return (
    <>
      <div className="mobile-toolbar">
        <div className="mobile-overview-chip">
          <span>
            <strong>{summary.postsInPeriod}</strong> posts
          </span>
          <span>
            <strong>{summary.placesMentioned}</strong> places
          </span>
        </div>
        <TimeRangeSlider />
      </div>

      <button type="button" className="mobile-menu-btn" onClick={openMenu}>
        ☰ Menu
      </button>

      {ui.mobileSheet === 'menu' && (
        <MobileSheet title="Menu" onClose={closeSheet}>
          <h2 className="mobile-menu-heading">Menu</h2>
          <ul className="mobile-menu-list">
            {MENU_ITEMS.map((item) => (
              <li key={item.id}>
                <button type="button" className="mobile-menu-item" onClick={() => { openSheet(item.id); }}>
                  {item.label}
                  <span aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        </MobileSheet>
      )}

      {ui.mobileSheet === 'filters' && (
        <MobileSheet title={SHEET_TITLES.filters} onClose={closeSheet} onBack={openMenu}>
          <FilterPanel />
        </MobileSheet>
      )}
      {ui.mobileSheet === 'layers' && (
        <MobileSheet title={SHEET_TITLES.layers} onClose={closeSheet} onBack={openMenu}>
          <LayerControls overlays={overlays} />
        </MobileSheet>
      )}
      {ui.mobileSheet === 'table' && (
        <MobileSheet title={SHEET_TITLES.table} onClose={closeSheet} onBack={openMenu}>
          <ResultsTable
            cells={cells}
            isLoading={isTableLoading}
            isError={isTableError}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={onSelectPlace}
          />
        </MobileSheet>
      )}
      {ui.mobileSheet === 'forecast' && (
        <MobileSheet title={SHEET_TITLES.forecast} onClose={closeSheet} onBack={openMenu}>
          <ForecastPanel
            cells={forecastCells}
            notYetConnected={forecastNotYetConnected}
            isLoading={isForecastLoading}
            isError={isForecastError}
          />
        </MobileSheet>
      )}
      {ui.mobileSheet === 'comparison' && (
        <MobileSheet title={SHEET_TITLES.comparison} onClose={closeSheet} onBack={openMenu}>
          <ComparisonPanel
            items={comparisonItems}
            isLoading={isComparisonLoading}
            isError={isComparisonError}
          />
        </MobileSheet>
      )}
      {ui.mobileSheet === 'import' && (
        <MobileSheet title={SHEET_TITLES.import} onClose={closeSheet} onBack={openMenu}>
          <SocialContentImport />
          <OverlayUpload />
        </MobileSheet>
      )}
    </>
  )
}
