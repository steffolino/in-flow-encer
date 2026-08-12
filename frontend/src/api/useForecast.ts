import { useQuery } from '@tanstack/react-query'
import { buildQuery, apiGet } from './client'
import { filtersToAttentionQuery } from '../lib/filtersToQuery'
import { queryKeys } from './queryKeys'
import { forecastResponseSchema } from './schemas'
import type { Filters } from '../state/filters'
import { useTenant } from '../state/tenant'

export function useForecast(filters: Filters, enabled = true) {
  const { activeSlug } = useTenant()
  return useQuery({
    queryKey: queryKeys.forecast(activeSlug, filters),
    queryFn: () =>
      apiGet(
        `/analytics/forecast${buildQuery(filtersToAttentionQuery(filters))}`,
        forecastResponseSchema,
        'analytics/forecast',
      ),
    enabled: enabled && Boolean(activeSlug),
  })
}
