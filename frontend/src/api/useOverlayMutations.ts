import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiDelete, apiPatchJson, apiPostForm } from './client'
import { importReportSchema, overlayLayerSchema, type OverlayVisibility } from './schemas'

export interface OverlayImportParams {
  file: File
  name: string
  measurementType: string
  unit?: string
}

function buildOverlayFormData(params: OverlayImportParams): FormData {
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append('name', params.name)
  formData.append('measurement_type', params.measurementType)
  if (params.unit) formData.append('unit', params.unit)
  return formData
}

export function useImportOverlayCsv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: OverlayImportParams) =>
      apiPostForm(
        '/overlays/import/csv',
        importReportSchema,
        'overlays/import/csv',
        buildOverlayFormData(params),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['overlays'] })
    },
  })
}

export function useImportOverlayGeojson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: OverlayImportParams) =>
      apiPostForm(
        '/overlays/import/geojson',
        importReportSchema,
        'overlays/import/geojson',
        buildOverlayFormData(params),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['overlays'] })
    },
  })
}

export interface OverlayPatchParams {
  id: string
  visibility?: OverlayVisibility
  name?: string
}

export function usePatchOverlay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: OverlayPatchParams) =>
      apiPatchJson(`/overlays/${id}`, overlayLayerSchema, 'overlays/{id}', body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['overlays'] })
    },
  })
}

export function useDeleteOverlay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/overlays/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['overlays'] })
    },
  })
}
