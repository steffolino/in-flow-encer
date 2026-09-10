import { FilterPanel } from '../filters/FilterPanel'
import { TimeRangeSlider } from '../filters/TimeRangeSlider'
import { LayerControls } from '../layers/LayerControls'
import { ComparisonPanel } from '../summary/ComparisonPanel'
import { ForecastPanel } from '../summary/ForecastPanel'
import { ResultsTable } from '../summary/ResultsTable'
import { OverlayUpload } from '../import/OverlayUpload'
import { SocialContentImport } from '../import/SocialContentImport'
import { isStaticDemo } from '../../api/demo'
import { useUI, type PanelId } from '../../state/ui'
import { FloatingPanel } from './FloatingPanel'
import type { AttentionCell, ForecastCell, OverlayLayer, ComparisonItem } from '../../api/schemas'
import type { DashboardSummary } from '../../lib/summary'

interface DesktopLayoutProps {
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

const PANEL_LABELS: Record<PanelId, string> = {
  filters: 'Filters',
  layers: 'Layers',
  forecast: 'Forecast & drivers',
  comparison: 'Compare to visitor flow',
  import: 'Import data',
}

export function DesktopLayout({
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
}: DesktopLayoutProps): React.JSX.Element {
  const { ui, dispatch } = useUI()

  const togglePanel = (panel: PanelId) => { dispatch({ type: 'TOGGLE_DESKTOP_PANEL', panel }); }
  const closePanel = () => { dispatch({ type: 'CLOSE_DESKTOP_PANEL' }); }

  return (
    <>
      <div className="hud-top-bar">
        <div className="hud-top-bar-group">
          <button
            type="button"
            className={`btn btn-secondary hud-toggle ${ui.desktopOpenPanel === 'filters' ? 'hud-toggle-active' : ''}`}
            onClick={() => { togglePanel('filters'); }}
          >
            Filters
          </button>
          <button
            type="button"
            className={`btn btn-secondary hud-toggle ${ui.desktopOpenPanel === 'layers' ? 'hud-toggle-active' : ''}`}
            onClick={() => { togglePanel('layers'); }}
          >
            Layers
          </button>
        </div>

        <TimeRangeSlider />

        <div className="hud-summary-strip">
          <span className="hud-stat">
            <strong>{summary.postsInPeriod}</strong> posts
          </span>
          <span className="hud-stat">
            <strong>{summary.placesMentioned}</strong> places
          </span>
          <span className="hud-stat">
            <strong>{summary.activeOverlayCount}</strong> overlays active
          </span>
        </div>

        <div className="hud-top-bar-group">
          <button
            type="button"
            className={`btn btn-secondary hud-toggle ${ui.desktopOpenPanel === 'forecast' ? 'hud-toggle-active' : ''}`}
            onClick={() => { togglePanel('forecast'); }}
          >
            Forecast
          </button>
          <button
            type="button"
            className={`btn btn-secondary hud-toggle ${ui.desktopOpenPanel === 'comparison' ? 'hud-toggle-active' : ''}`}
            onClick={() => { togglePanel('comparison'); }}
          >
            Compare
          </button>
          <button
            type="button"
            className={`btn btn-secondary hud-toggle ${ui.desktopOpenPanel === 'import' ? 'hud-toggle-active' : ''}`}
            onClick={() => { togglePanel('import'); }}
          >
            Import
          </button>
        </div>
      </div>

      {ui.desktopOpenPanel === 'filters' && (
        <FloatingPanel title={PANEL_LABELS.filters} side="left" onClose={closePanel}>
          <FilterPanel />
        </FloatingPanel>
      )}
      {ui.desktopOpenPanel === 'layers' && (
        <FloatingPanel title={PANEL_LABELS.layers} side="left" onClose={closePanel}>
          <LayerControls overlays={overlays} />
        </FloatingPanel>
      )}
      {ui.desktopOpenPanel === 'forecast' && (
        <FloatingPanel title={PANEL_LABELS.forecast} side="right" onClose={closePanel}>
          <ForecastPanel
            cells={forecastCells}
            notYetConnected={forecastNotYetConnected}
            isLoading={isForecastLoading}
            isError={isForecastError}
          />
        </FloatingPanel>
      )}
      {ui.desktopOpenPanel === 'comparison' && (
        <FloatingPanel title={PANEL_LABELS.comparison} side="right" onClose={closePanel}>
          <ComparisonPanel
            items={comparisonItems}
            isLoading={isComparisonLoading}
            isError={isComparisonError}
          />
        </FloatingPanel>
      )}
      {ui.desktopOpenPanel === 'import' && (
        <FloatingPanel title={PANEL_LABELS.import} side="right" onClose={closePanel}>
          {isStaticDemo ? <p>This demo uses a read-only data snapshot. Imports and uploads are available when running the local backend.</p> : <><SocialContentImport /><OverlayUpload /></>}
        </FloatingPanel>
      )}

      <div className={`hud-table-drawer ${ui.desktopTableExpanded ? 'hud-table-drawer-open' : ''}`}>
        <button
          type="button"
          className="hud-table-drawer-handle"
          onClick={() => { dispatch({ type: 'TOGGLE_TABLE_EXPANDED' }); }}
          aria-expanded={ui.desktopTableExpanded}
        >
          {ui.desktopTableExpanded ? '▾ Hide places table' : '▴ Show places table'}
        </button>
        {ui.desktopTableExpanded && (
          <div className="hud-table-drawer-body">
            <ResultsTable
              cells={cells}
              isLoading={isTableLoading}
              isError={isTableError}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={onSelectPlace}
            />
          </div>
        )}
      </div>
    </>
  )
}
