import type { ForecastCell } from '../../api/schemas'
import { formatSignedPercent } from '../../lib/format'

interface ForecastPanelProps {
  cells: ForecastCell[]
  notYetConnected: string[]
  isLoading: boolean
  isError: boolean
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: 'High confidence (10+ posts observed)',
  medium: 'Medium confidence (3-9 posts observed)',
  low: 'Low confidence (fewer than 3 posts observed)',
}

/**
 * Shows the naive trend-extrapolation forecast per place: current vs.
 * projected score, the trend it's extrapolated from, an uncertainty range,
 * and — the honest part — exactly which signals fed the projection and
 * which ones didn't. See docs/adr/0008-naive-trend-forecast.md for the
 * formula this panel is displaying, not re-deriving.
 */
export function ForecastPanel({
  cells,
  notYetConnected,
  isLoading,
  isError,
}: ForecastPanelProps): React.JSX.Element {
  return (
    <section className="panel" aria-labelledby="forecast-heading">
      <h2 id="forecast-heading">Forecast &amp; drivers</h2>
      <p className="layer-meta">
        A simple trend projection for the next equivalent period, not a machine-learning
        prediction — see the About page for the exact formula.
      </p>
      {isLoading && <p className="status-message">Loading forecast…</p>}
      {isError && (
        <p className="error-message" role="alert">
          Could not load the forecast.
        </p>
      )}
      {!isLoading && !isError && cells.length === 0 && (
        <p className="status-message">No forecast data for the current filters.</p>
      )}
      {!isLoading && !isError && cells.length > 0 && (
        <ul className="comparison-list">
          {cells.map((cell) => (
            <li className="comparison-item" key={cell.place_id}>
              <strong>{cell.place_name}</strong>
              <div>
                <span className="badge badge-observational">
                  Current: {cell.attention_score.toFixed(2)}
                </span>{' '}
                <span className="badge badge-forecast">
                  Projected: {cell.forecast_score.toFixed(2)}
                </span>
              </div>
              <p style={{ margin: '0.3rem 0 0' }}>
                Trend: {formatSignedPercent(cell.trend_pct)} · Range:{' '}
                {cell.forecast_score_low.toFixed(2)}–{cell.forecast_score_high.toFixed(2)} ·{' '}
                {CONFIDENCE_LABELS[cell.confidence] ?? cell.confidence}
              </p>
            </li>
          ))}
        </ul>
      )}
      <h3>Drivers used</h3>
      <ul className="legend-list" aria-label="Forecast drivers">
        {cells[0] &&
          Object.entries(cells[0].drivers).map(([driver, weight]) => (
            <li key={driver} className="legend-item">
              {driver.replace(/_/g, ' ')}: {(weight * 100).toFixed(0)}%
            </li>
          ))}
      </ul>
      <h3>Not yet connected</h3>
      <p className="layer-meta">
        {notYetConnected.length > 0
          ? `${notYetConnected.join(', ')} are not part of this projection yet.`
          : 'No additional signal sources documented.'}
      </p>
    </section>
  )
}
