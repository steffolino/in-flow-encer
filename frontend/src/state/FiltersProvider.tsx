import { useMemo, useReducer, type ReactNode } from 'react'
import { FiltersContext, filtersReducer, initialFilters } from './filters'

export function FiltersProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [filters, dispatch] = useReducer(filtersReducer, undefined, initialFilters)
  const value = useMemo(() => ({ filters, dispatch }), [filters])
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}
