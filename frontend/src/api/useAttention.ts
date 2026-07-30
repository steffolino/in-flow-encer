import { useQuery } from '@tanstack/react-query'
import { buildQuery, apiGet } from './client'
import { filtersToAttentionQuery } from '../lib/filtersToQuery'
import { queryKeys } from './queryKeys'
import { attentionResponseSchema } from './schemas'
import type { Filters } from '../state/filters'

export function useAttention(filters: Filters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.attention(filters),
    queryFn: () =>
      apiGet(
        `/analytics/attention${buildQuery(filtersToAttentionQuery(filters))}`,
        attentionResponseSchema,
        'analytics/attention',
      ),
    enabled,
  })
}
