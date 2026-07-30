import { useQuery } from '@tanstack/react-query'
import { buildQuery, apiGet } from './client'
import { filtersToComparisonQuery } from '../lib/filtersToQuery'
import { queryKeys } from './queryKeys'
import { comparisonResponseSchema } from './schemas'
import type { Filters } from '../state/filters'
import { useTenant } from '../state/tenant'

export function useComparison(filters: Filters, enabled = true) {
  const { activeSlug } = useTenant()
  return useQuery({
    queryKey: queryKeys.comparison(activeSlug, filters),
    queryFn: () =>
      apiGet(
        `/analytics/comparison${buildQuery(filtersToComparisonQuery(filters))}`,
        comparisonResponseSchema,
        'analytics/comparison',
      ),
    enabled: enabled && Boolean(activeSlug),
  })
}
