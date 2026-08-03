import { useEffect, useState } from 'react'

/**
 * Tablet-portrait viewports (~768-834px) get the mobile layout; tablet-landscape
 * (~1024px+) and up get the desktop HUD layout. 900px sits between the two.
 */
const DESKTOP_QUERY = '(min-width: 900px)'

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches)

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY)
    const listener = (event: MediaQueryListEvent) => { setIsDesktop(event.matches); }
    mql.addEventListener('change', listener)
    return () => { mql.removeEventListener('change', listener); }
  }, [])

  return isDesktop
}
