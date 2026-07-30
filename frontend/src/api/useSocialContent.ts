import { useQuery } from '@tanstack/react-query'
import { buildQuery, apiGet } from './client'
import { filtersToSocialContentQuery } from '../lib/filtersToQuery'
import { queryKeys } from './queryKeys'
import { socialContentPageSchema } from './schemas'
import type { Filters } from '../state/filters'
import { useTenant } from '../state/tenant'

const PAGE_SIZE = 100

export function useSocialContent(filters: Filters, enabled = true) {
  const { activeSlug } = useTenant()
  return useQuery({
    queryKey: queryKeys.socialContent(activeSlug, filters),
    queryFn: () =>
      apiGet(
        `/social-content${buildQuery(filtersToSocialContentQuery(filters, { limit: PAGE_SIZE, offset: 0 }))}`,
        socialContentPageSchema,
        'social-content',
      ),
    enabled: enabled && Boolean(activeSlug),
  })
}
