import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { TenantProvider } from './state/TenantProvider.tsx'
import { FiltersProvider } from './state/FiltersProvider.tsx'
import { LayersProvider } from './state/LayersProvider.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <FiltersProvider>
          <LayersProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </LayersProvider>
        </FiltersProvider>
      </TenantProvider>
    </QueryClientProvider>
  </StrictMode>,
)
