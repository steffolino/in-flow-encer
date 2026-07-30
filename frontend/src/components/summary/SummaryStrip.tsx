import { formatCompactNumber, formatInteger, formatPercentChange } from '../../lib/format'
import type { DashboardSummary } from '../../lib/summary'

export function SummaryStrip({ summary }: { summary: DashboardSummary }): React.JSX.Element {
  return (
    <section className="panel" aria-labelledby="summary-heading">
      <h2 id="summary-heading">Summary for current filters</h2>
      <div className="summary-strip">
        <Tile label="Posts in period" value={formatInteger(summary.postsInPeriod)} />
        <Tile label="Places mentioned" value={formatInteger(summary.placesMentioned)} />
        <Tile label="Unique creators (approx.)" value={formatInteger(summary.uniqueCreators)} />
        <Tile label="Estimated reach" value={formatCompactNumber(summary.estimatedReach)} />
        <Tile
          label="Strongest rising location"
          value={
            summary.strongestRising
              ? `${summary.strongestRising.placeName} (${formatPercentChange(summary.strongestRising.change)})`
              : 'No prior-period data'
          }
        />
        <Tile label="Active overlays" value={formatInteger(summary.activeOverlayCount)} />
      </div>
    </section>
  )
}

function Tile({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="summary-tile">
      <span className="value">{value}</span>
      <span className="label">{label}</span>
    </div>
  )
}
