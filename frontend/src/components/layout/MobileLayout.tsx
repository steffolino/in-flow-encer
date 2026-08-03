import { FilterPanel } from '../filters/FilterPanel'
import { LayerControls } from '../layers/LayerControls'
import { ComparisonPanel } from '../summary/ComparisonPanel'
import { ResultsTable } from '../summary/ResultsTable'
import { OverlayUpload } from '../import/OverlayUpload'
import { SocialContentImport } from '../import/SocialContentImport'
import { useUI, type MobileSheetId } from '../../state/ui'
import { MobileSheet } from './MobileSheet'
import type { AttentionCell, OverlayLayer, ComparisonItem } from '../../api/schemas'
import type { DashboardSummary } from '../../lib/summary'

interface MobileLayoutProps {
  cells: AttentionCell[]
  overlays: OverlayLayer[]
  selectedPlaceId: string | null
  onSelectPlace: (placeId: string) => void
  summary: DashboardSummary
  comparisonItems: ComparisonItem[]
  isTableLoading: boolean
  isTableError: boolean
  isComparisonLoading: boolean
  isComparisonError: boolean
}

const MENU_ITEMS: { id: MobileSheetId; label: string }[] = [
  { id: 'filters', label: 'Filters' },
  { id: 'layers', label: 'Map layers' },
  { id: 'table', label: 'Places table' },
  { id: 'comparison', label: 'Compare to visitor flow' },
  { id: 'import', label: 'Import data' },
]

const SHEET_TITLES: Record<MobileSheetId, string> = {
  filters: 'Filters',
  layers: 'Map layers',
  table: 'Places table',
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
  isTableLoading,
  isTableError,
  isComparisonLoading,
  isComparisonError,
}: MobileLayoutProps): React.JSX.Element {
  const { ui, dispatch } = useUI()

  const openMenu = () => { dispatch({ type: 'OPEN_MOBILE_MENU' }); }
  const openSheet = (panel: MobileSheetId) => { dispatch({ type: 'OPEN_MOBILE_SHEET', panel }); }
  const closeSheet = () => { dispatch({ type: 'CLOSE_MOBILE_SHEET' }); }

  return (
    <>
      <div className="mobile-overview-chip">
        <span>
          <strong>{summary.postsInPeriod}</strong> posts
        </span>
        <span>
          <strong>{summary.placesMentioned}</strong> places
        </span>
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
