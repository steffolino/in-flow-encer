import { useQuery } from '@tanstack/react-query'
import { apiGet } from './client'
import { queryKeys } from './queryKeys'
import { overlayFeatureCollectionSchema, overlayLayerListSchema } from './schemas'
import { useTenant } from '../state/tenant'

export function useOverlays(enabled = true) {
  const { activeSlug } = useTenant()
  return useQuery({
    queryKey: queryKeys.overlays(activeSlug),
    queryFn: () => apiGet('/overlays', overlayLayerListSchema, 'overlays'),
    enabled: enabled && Boolean(activeSlug),
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
