import type { ComparisonItem } from '../../api/schemas'

interface ComparisonPanelProps {
  items: ComparisonItem[]
  isLoading: boolean
  isError: boolean
}

/**
 * Renders the plain-language attention-vs-visitor-flow statements returned
 * by /analytics/comparison verbatim. Classification (high/low/unknown) is
 * computed entirely server-side; this component only displays it.
 */
export function ComparisonPanel({ items, isLoading, isError }: ComparisonPanelProps): React.JSX.Element {
  return (
    <section className="panel" aria-labelledby="comparison-heading">
      <h2 id="comparison-heading">Attention vs. visitor flow</h2>
      {isLoading && <p className="status-message">Loading comparison…</p>}
      {isError && (
        <p className="error-message" role="alert">
          Could not load the attention/visitor-flow comparison.
        </p>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <p className="status-message">No comparison data for the current filters.</p>
      )}
      {!isLoading && !isError && items.length > 0 && (
        <ul className="comparison-list">
          {items.map((item) => (
            <li className="comparison-item" key={item.place_id}>
              <strong>{item.place_name}</strong>
              <div>
                <span className="badge badge-observational">
                  Attention: {item.attention_level}
                </span>{' '}
                <span className="badge badge-overlay">
                  Visitor flow: {item.visitor_flow_level}
                </span>
              </div>
              <p style={{ margin: '0.3rem 0 0' }}>{item.statement}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
