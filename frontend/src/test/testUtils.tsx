import type { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { FiltersProvider } from '../state/FiltersProvider'
import { LayersProvider } from '../state/LayersProvider'
import { TenantProvider } from '../state/TenantProvider'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function AllProviders({ children }: { children: ReactNode }): ReactElement {
  const client = createTestQueryClient()
  return (
    <QueryClientProvider client={client}>
      <TenantProvider>
        <FiltersProvider>
          <LayersProvider>{children}</LayersProvider>
        </FiltersProvider>
      </TenantProvider>
    </QueryClientProvider>
  )
}

export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: AllProviders })
}
