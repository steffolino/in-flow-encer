import { createContext, useContext, type Dispatch } from 'react'

/** Panels that can be surfaced in either the desktop HUD or the mobile menu sheet. */
export type PanelId = 'filters' | 'layers' | 'comparison' | 'import'

/** Mobile's menu additionally drills into the places table, which desktop keeps as its own drawer. */
export type MobileSheetId = PanelId | 'table'

export interface UIState {
  /** Desktop: which floating HUD panel (if any) is open. */
  desktopOpenPanel: PanelId | null
  /** Desktop: whether the bottom results-table drawer is expanded. */
  desktopTableExpanded: boolean
  /** Mobile: 'menu' shows the top-level list; a MobileSheetId drills into that panel. */
  mobileSheet: 'menu' | MobileSheetId | null
}

export function initialUIState(): UIState {
  return {
    desktopOpenPanel: null,
    desktopTableExpanded: false,
    mobileSheet: null,
  }
}

export type UIAction =
  | { type: 'TOGGLE_DESKTOP_PANEL'; panel: PanelId }
  | { type: 'CLOSE_DESKTOP_PANEL' }
  | { type: 'TOGGLE_TABLE_EXPANDED' }
  | { type: 'OPEN_MOBILE_MENU' }
  | { type: 'OPEN_MOBILE_SHEET'; panel: MobileSheetId }
  | { type: 'CLOSE_MOBILE_SHEET' }

export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'TOGGLE_DESKTOP_PANEL':
      return {
        ...state,
        desktopOpenPanel: state.desktopOpenPanel === action.panel ? null : action.panel,
      }
    case 'CLOSE_DESKTOP_PANEL':
      return { ...state, desktopOpenPanel: null }
    case 'TOGGLE_TABLE_EXPANDED':
      return { ...state, desktopTableExpanded: !state.desktopTableExpanded }
    case 'OPEN_MOBILE_MENU':
      return { ...state, mobileSheet: 'menu' }
    case 'OPEN_MOBILE_SHEET':
      return { ...state, mobileSheet: action.panel }
    case 'CLOSE_MOBILE_SHEET':
      return { ...state, mobileSheet: null }
  }
}

export interface UIContextValue {
  ui: UIState
  dispatch: Dispatch<UIAction>
}

export const UIContext = createContext<UIContextValue | null>(null)

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext)
  if (!ctx) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return ctx
}
