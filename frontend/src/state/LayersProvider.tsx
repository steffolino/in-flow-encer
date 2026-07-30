import { useMemo, useReducer, type ReactNode } from 'react'
import { LayersContext, initialLayersState, layersReducer } from './layers'

export function LayersProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [layers, dispatch] = useReducer(layersReducer, undefined, initialLayersState)
  const value = useMemo(() => ({ layers, dispatch }), [layers])
  return <LayersContext.Provider value={value}>{children}</LayersContext.Provider>
}
