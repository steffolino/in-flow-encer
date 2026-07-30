import { useQuery } from '@tanstack/react-query'
import { apiGet } from './client'
import { queryKeys } from './queryKeys'
import { overlayFeatureCollectionSchema, overlayLayerListSchema } from './schemas'

export function useOverlays(enabled = true) {
  return useQuery({
    queryKey: queryKeys.overlays,
    queryFn: () => apiGet('/overlays', overlayLayerListSchema, 'overlays'),
    enabled,
  })
}

export function useOverlayFeatures(overlayId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.overlayFeatures(overlayId),
    queryFn: () =>
      apiGet(
        `/overlays/${overlayId}/features`,
        overlayFeatureCollectionSchema,
        'overlays/{id}/features',
      ),
    enabled,
  })
}
