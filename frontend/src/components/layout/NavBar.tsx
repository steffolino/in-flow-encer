import { NavLink } from 'react-router-dom'

/** Persistent top-level navigation, shown on every page. */
export function NavBar(): React.JSX.Element {
  return (
    <nav className="app-nav" aria-label="Main">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'app-nav-link app-nav-link-active' : 'app-nav-link')}>
        Map
      </NavLink>
      <NavLink to="/about" className={({ isActive }) => (isActive ? 'app-nav-link app-nav-link-active' : 'app-nav-link')}>
        About &amp; methodology
      </NavLink>
      <a
        className="app-nav-link"
        href="https://stefanstretz.de/impressum"
        target="_blank"
        rel="noopener noreferrer"
      >
        Imprint
      </a>
    </nav>
  )
}
