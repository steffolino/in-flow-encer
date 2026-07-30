import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPostJson } from './client'
import { importReportSchema, type SocialContentImportItem } from './schemas'

export interface SocialContentImportPayload {
  source_name: string
  provider?: string
  items: SocialContentImportItem[]
}

export function useImportSocialContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SocialContentImportPayload) =>
      apiPostJson('/social-content/import', importReportSchema, 'social-content/import', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['social-content'] })
      await queryClient.invalidateQueries({ queryKey: ['attention'] })
      await queryClient.invalidateQueries({ queryKey: ['comparison'] })
    },
  })
}
