import { createContext, useContext } from 'react'

export interface TenantContextValue {
  activeSlug: string | null
  setActiveSlug: (slug: string) => void
}

export const TENANT_STORAGE_KEY = 'inflow-encer:tenant-slug'

export const TenantContext = createContext<TenantContextValue | null>(null)

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext)
  if (!ctx) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return ctx
}
