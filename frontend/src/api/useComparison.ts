import { useQuery } from '@tanstack/react-query'
import { buildQuery, apiGet } from './client'
import { filtersToComparisonQuery } from '../lib/filtersToQuery'
import { queryKeys } from './queryKeys'
import { comparisonResponseSchema } from './schemas'
import type { Filters } from '../state/filters'

export function useComparison(filters: Filters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.comparison(filters),
    queryFn: () =>
      apiGet(
        `/analytics/comparison${buildQuery(filtersToComparisonQuery(filters))}`,
        comparisonResponseSchema,
        'analytics/comparison',
      ),
    enabled,
  })
}
