import { TenantSwitcher } from '../tenant/TenantSwitcher'

export function Header(): React.JSX.Element {
  return (
    <>
      <header className="app-header">
        <h1>InFlowoEncer — Visitor Flow &amp; Attention Monitor</h1>
        <TenantSwitcher />
      </header>
      <div className="synthetic-data-banner" role="note">
        <span className="badge badge-synthetic">Synthetic / test data</span>{' '}
        All places, social content, and visitor-flow overlays shown here are synthetic
        data for the Bavarian Alps MVP — nothing on this screen reflects real visitors.
      </div>
    </>
  )
}
