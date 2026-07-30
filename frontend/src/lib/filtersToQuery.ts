import type { Filters } from '../state/filters'

/** Maps client filter state to the backend's query-parameter names. */
export function filtersToAttentionQuery(filters: Filters): Record<string, string | undefined> {
  return {
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    platform: filters.platform || undefined,
    region: filters.region || undefined,
    source_id: filters.sourceId || undefined,
  }
}

export function filtersToComparisonQuery(filters: Filters): Record<string, string | undefined> {
  return {
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    region: filters.region || undefined,
  }
}

export function filtersToSocialContentQuery(
  filters: Filters,
  pagination: { limit: number; offset: number },
): Record<string, string | number | undefined> {
  return {
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    platform: filters.platform || undefined,
    region: filters.region || undefined,
    source_id: filters.sourceId || undefined,
    author_category: filters.authorCategory || undefined,
    limit: pagination.limit,
    offset: pagination.offset,
  }
}
