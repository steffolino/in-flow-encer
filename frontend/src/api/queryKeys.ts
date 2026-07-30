import type { Filters } from '../state/filters'

/**
 * Central, stable query-key factory. Keeping keys here (instead of ad hoc
 * arrays scattered across hooks) makes cache invalidation predictable and
 * avoids accidental key drift between the hook that reads a resource and
 * the mutation that should invalidate it.
 */
export const queryKeys = {
  tenants: ['tenants'] as const,
  places: ['places'] as const,
  // Every tenant-scoped resource includes the active tenant slug in its key.
  // Without it, switching tenants with identical filter values would not
  // refetch at all, silently serving the previous tenant's cached data.
  attention: (tenantSlug: string | null, filters: Filters) =>
    ['attention', tenantSlug, filters] as const,
  comparison: (tenantSlug: string | null, filters: Filters) =>
    ['comparison', tenantSlug, filters] as const,
  socialContent: (tenantSlug: string | null, filters: Filters) =>
    ['social-content', tenantSlug, filters] as const,
  overlays: (tenantSlug: string | null) => ['overlays', tenantSlug] as const,
  overlayFeatures: (overlayId: string) => ['overlay-features', overlayId] as const,
}
