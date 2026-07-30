import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
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
 */
export function TenantProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [activeSlug, setActiveSlugState] = useState<string | null>(() => readStoredSlug())

  useEffect(() => {
    setActiveTenantSlug(activeSlug)
  }, [activeSlug])

  const setActiveSlug = useCallback((slug: string) => {
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
