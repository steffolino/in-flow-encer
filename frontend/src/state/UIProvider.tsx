import { useMemo, useReducer, type ReactNode } from 'react'
import { UIContext, uiReducer, initialUIState } from './ui'

export function UIProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [ui, dispatch] = useReducer(uiReducer, undefined, initialUIState)
  const value = useMemo(() => ({ ui, dispatch }), [ui])
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}
