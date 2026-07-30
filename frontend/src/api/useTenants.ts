import { useQuery } from '@tanstack/react-query'
import { apiGet } from './client'
import { queryKeys } from './queryKeys'
import { tenantListSchema } from './schemas'

export function useTenants() {
  return useQuery({
    queryKey: queryKeys.tenants,
    queryFn: () => apiGet('/tenants', tenantListSchema, 'tenants'),
    staleTime: 5 * 60 * 1000,
  })
}
