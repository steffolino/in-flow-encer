import { createContext, useContext, type Dispatch } from 'react'

/** Fixed ids for the two built-in social-attention layers. Overlay layers use their own backend id. */
export const ATTENTION_HEATMAP_LAYER_ID = 'social-attention-heatmap'
export const SOCIAL_POINTS_LAYER_ID = 'social-content-points'

export interface LayerState {
  visible: boolean
  opacity: number
}

export type LayersState = Record<string, LayerState>

export function defaultLayerState(): LayerState {
  return { visible: true, opacity: 0.85 }
}

export function initialLayersState(): LayersState {
  return {
    [ATTENTION_HEATMAP_LAYER_ID]: { visible: true, opacity: 0.85 },
    [SOCIAL_POINTS_LAYER_ID]: { visible: false, opacity: 1 },
  }
}

export type LayersAction =
  | { type: 'SET_VISIBLE'; layerId: string; visible: boolean }
  | { type: 'SET_OPACITY'; layerId: string; opacity: number }
  | { type: 'ENSURE_LAYER'; layerId: string; defaultVisible: boolean }

export function layersReducer(state: LayersState, action: LayersAction): LayersState {
  switch (action.type) {
    case 'SET_VISIBLE':
      return {
        ...state,
        [action.layerId]: {
          ...(state[action.layerId] ?? defaultLayerState()),
          visible: action.visible,
        },
      }
    case 'SET_OPACITY':
      return {
        ...state,
        [action.layerId]: {
          ...(state[action.layerId] ?? defaultLayerState()),
          opacity: action.opacity,
        },
      }
    case 'ENSURE_LAYER':
      if (state[action.layerId]) return state
      return {
        ...state,
        [action.layerId]: { visible: action.defaultVisible, opacity: 0.85 },
      }
  }
}

export interface LayersContextValue {
  layers: LayersState
  dispatch: Dispatch<LayersAction>
}

export const LayersContext = createContext<LayersContextValue | null>(null)

export function useLayers(): LayersContextValue {
  const ctx = useContext(LayersContext)
  if (!ctx) {
    throw new Error('useLayers must be used within a LayersProvider')
  }
  return ctx
}
