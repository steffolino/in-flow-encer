import { Link } from 'react-router-dom'

export function ImprintPage(): React.JSX.Element {
  return (
    <div className="app-shell">
      <main className="imprint-page">
        <h1>Imprint</h1>
        <p className="status-message">
          Legal contact details (name, address, contact info as required by TMG §5) go
          here — this placeholder needs to be filled in before the site is public.
        </p>
        <Link to="/">← Back to the map</Link>
      </main>
    </div>
  )
}
