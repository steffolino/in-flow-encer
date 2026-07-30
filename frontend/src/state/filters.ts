import { createContext, useContext, type Dispatch } from 'react'
import { defaultDateRange } from '../lib/dateRange'

/**
 * Explicit client-side filter state. This is deliberately NOT server state:
 * it drives which queries TanStack Query runs, but its own value lives here
 * in a small typed reducer so filter changes are traceable and testable in
 * isolation.
 */
export interface Filters {
  dateFrom: string
  dateTo: string
  platform: string
  region: string
  sourceId: string
  authorCategory: string
}

export function initialFilters(): Filters {
  const { from, to } = defaultDateRange()
  return {
    dateFrom: from,
    dateTo: to,
    platform: '',
    region: '',
    sourceId: '',
    authorCategory: '',
  }
}

export type FiltersAction =
  | { type: 'SET_DATE_FROM'; value: string }
  | { type: 'SET_DATE_TO'; value: string }
  | { type: 'SET_PLATFORM'; value: string }
  | { type: 'SET_REGION'; value: string }
  | { type: 'SET_SOURCE_ID'; value: string }
  | { type: 'SET_AUTHOR_CATEGORY'; value: string }
  | { type: 'RESET' }

export function filtersReducer(state: Filters, action: FiltersAction): Filters {
  switch (action.type) {
    case 'SET_DATE_FROM':
      return { ...state, dateFrom: action.value }
    case 'SET_DATE_TO':
      return { ...state, dateTo: action.value }
    case 'SET_PLATFORM':
      return { ...state, platform: action.value }
    case 'SET_REGION':
      return { ...state, region: action.value }
    case 'SET_SOURCE_ID':
      return { ...state, sourceId: action.value }
    case 'SET_AUTHOR_CATEGORY':
      return { ...state, authorCategory: action.value }
    case 'RESET':
      return initialFilters()
  }
}

export interface FiltersContextValue {
  filters: Filters
  dispatch: Dispatch<FiltersAction>
}

export const FiltersContext = createContext<FiltersContextValue | null>(null)

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext)
  if (!ctx) {
    throw new Error('useFilters must be used within a FiltersProvider')
  }
  return ctx
}
