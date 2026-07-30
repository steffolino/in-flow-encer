import { useQuery } from '@tanstack/react-query'
import { apiGet } from './client'
import { queryKeys } from './queryKeys'
import { placeListSchema } from './schemas'

export function usePlaces(enabled = true) {
  return useQuery({
    queryKey: queryKeys.places,
    queryFn: () => apiGet('/places', placeListSchema, 'places'),
    staleTime: 5 * 60 * 1000,
    enabled,
  })
}
