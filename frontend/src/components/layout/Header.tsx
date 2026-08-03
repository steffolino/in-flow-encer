import { TenantSwitcher } from '../tenant/TenantSwitcher'

export function Header(): React.JSX.Element {
  return (
    <>
      <header className="app-header">
        <h1>Inflowencer — Visitor Flow &amp; Attention Monitor</h1>
        <TenantSwitcher />
      </header>
      <p className="app-intro">
        Social-media buzz about a place often shows up days before the visitors do, but
        tourism boards have no easy way to see it coming or to check it against what's
        actually happening on the ground. Inflowencer maps public social-media attention
        around places in the Bavarian Alps side by side with your own visitor-flow data
        (footfall, parking, transit counts), so you can spot where attention is building
        before it turns into crowds.
      </p>
      <p className="app-intro app-intro-usage">
        Explore the map, filter by date/platform/region, toggle attention and visitor-flow
        layers, compare the two, and import your own data — all from the controls around
        the map.
      </p>
      <div className="synthetic-data-banner" role="note">
        <span className="badge badge-synthetic">Synthetic / test data</span>{' '}
        All places, social content, and visitor-flow overlays shown here are synthetic
        data for the Bavarian Alps MVP — nothing on this screen reflects real visitors.
      </div>
    </>
  )
}
