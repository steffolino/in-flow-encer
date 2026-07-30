import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { setActiveTenantSlug } from '../api/client'
import { TENANT_STORAGE_KEY, TenantContext } from './tenant'

function readStoredSlug(): string | null {
  try {
    return window.localStorage.getItem(TENANT_STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Persists the developer's chosen tenant to localStorage and keeps the API
 * client's `X-Tenant-Slug` header in sync with it. This is the only place
 * that writes to `setActiveTenantSlug`.
 *
 * The header is updated synchronously (both on first render and on every
 * change), never from a useEffect. A useEffect here runs after children have
 * already re-rendered and may have already fired fetches for their new
 * (tenant-keyed) queries — those fetches would race against the header
 * update and could still send the *previous* tenant's header, silently
 * caching the wrong tenant's response under the new tenant's cache key.
 */
export function TenantProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [activeSlug, setActiveSlugState] = useState<string | null>(() => {
    const stored = readStoredSlug()
    setActiveTenantSlug(stored)
    return stored
  })

  const setActiveSlug = useCallback((slug: string) => {
    setActiveTenantSlug(slug)
    setActiveSlugState(slug)
    try {
      window.localStorage.setItem(TENANT_STORAGE_KEY, slug)
    } catch {
      // localStorage may be unavailable (private browsing, disabled storage); non-fatal.
    }
  }, [])

  const value = useMemo(() => ({ activeSlug, setActiveSlug }), [activeSlug, setActiveSlug])

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}
