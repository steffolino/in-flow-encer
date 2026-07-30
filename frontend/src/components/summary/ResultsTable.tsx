import { formatCompactNumber, formatConfidence, formatInteger, formatPercentChange } from '../../lib/format'
import type { AttentionCell } from '../../api/schemas'

interface ResultsTableProps {
  cells: AttentionCell[]
  isLoading: boolean
  isError: boolean
  selectedPlaceId: string | null
  onSelectPlace: (placeId: string) => void
}

/**
 * The accessible, non-map alternative to the heatmap: every place currently
 * shown on the map, as a plain data table a screen-reader or keyboard-only
 * user can consume without ever touching the canvas. Selecting a row also
 * flies the map to (and highlights) that place, so the table isn't just a
 * read-only fallback — it drives the map the same way clicking a marker does.
 */
export function ResultsTable({
  cells,
  isLoading,
  isError,
  selectedPlaceId,
  onSelectPlace,
}: ResultsTableProps): React.JSX.Element {
  return (
    <section className="panel" aria-labelledby="results-table-heading">
      <h2 id="results-table-heading">Places in view</h2>
      {isLoading && <p className="status-message">Loading attention data…</p>}
      {isError && (
        <p className="error-message" role="alert">
          Could not load attention data for the current filters.
        </p>
      )}
      {!isLoading && !isError && cells.length === 0 && (
        <p className="status-message">No places match the current filters.</p>
      )}
      {!isLoading && !isError && cells.length > 0 && (
        <div className="table-scroll">
          <table className="data-table">
            <caption>
              Social-attention metrics per place for the selected filters (synthetic/test data).
            </caption>
            <thead>
              <tr>
                <th scope="col">Place</th>
                <th scope="col">Post count</th>
                <th scope="col">Estimated reach</th>
                <th scope="col">Engagement</th>
                <th scope="col">Attention score</th>
                <th scope="col">Change vs. prior period</th>
                <th scope="col">Match confidence (avg.)</th>
              </tr>
            </thead>
            <tbody>
              {cells.map((cell) => {
                const isSelected = cell.place_id === selectedPlaceId
                return (
                  <tr key={cell.place_id} aria-selected={isSelected} className={isSelected ? 'row-selected' : ''}>
                    <th scope="row">
                      <button
                        type="button"
                        className="link-button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          onSelectPlace(cell.place_id)
                        }}
                      >
                        {cell.place_name}
                        {isSelected ? ' (selected — see map)' : ''}
                      </button>
                    </th>
                    <td>{formatInteger(cell.post_count)}</td>
                    <td>{formatCompactNumber(cell.total_reach)}</td>
                    <td>{formatCompactNumber(cell.total_engagement)}</td>
                    <td>{cell.attention_score.toFixed(2)}</td>
                    <td>{formatPercentChange(cell.change_vs_previous_period)}</td>
                    <td>{formatConfidence(cell.avg_confidence)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
