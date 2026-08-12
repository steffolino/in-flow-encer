import { TenantSwitcher } from '../tenant/TenantSwitcher'
import { NavBar } from './NavBar'

/** The one shared top bar, identical on every page — see NavBar for the page links. */
export function Header(): React.JSX.Element {
  return (
    <header className="app-header">
      <h1>Inflowencer — Visitor Flow &amp; Attention Monitor</h1>
      <NavBar />
      <TenantSwitcher />
    </header>
  )
}
