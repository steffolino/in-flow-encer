import { TenantSwitcher } from '../tenant/TenantSwitcher'
import { NavBar } from './NavBar'

interface HeaderProps {
  showTenantSwitcher?: boolean
}

/** Shared top bar; tenant selection is only shown on data-bearing map views. */
export function Header({ showTenantSwitcher = false }: HeaderProps): React.JSX.Element {
  return (
    <header className="app-header">
      <h1>Inflowencer - Visitor Flow &amp; Attention Monitor</h1>
      <NavBar />
      {showTenantSwitcher && <TenantSwitcher />}
    </header>
  )
}
