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
  attention: (filters: Filters) => ['attention', filters] as const,
  comparison: (filters: Filters) => ['comparison', filters] as const,
  socialContent: (filters: Filters) => ['social-content', filters] as const,
  overlays: ['overlays'] as const,
  overlayFeatures: (overlayId: string) => ['overlay-features', overlayId] as const,
}
