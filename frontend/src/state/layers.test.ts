import { describe, expect, it } from 'vitest'
import {
  ATTENTION_HEATMAP_LAYER_ID,
  initialLayersState,
  layersReducer,
} from './layers'

describe('layersReducer', () => {
  it('starts with the attention heatmap visible and the point view hidden', () => {
    const state = initialLayersState()
    expect(state[ATTENTION_HEATMAP_LAYER_ID]?.visible).toBe(true)
  })

  it('toggles a layer visibility flag without touching its opacity', () => {
    const state = initialLayersState()
    const next = layersReducer(state, {
      type: 'SET_VISIBLE',
      layerId: ATTENTION_HEATMAP_LAYER_ID,
      visible: false,
    })
    expect(next[ATTENTION_HEATMAP_LAYER_ID]?.visible).toBe(false)
    expect(next[ATTENTION_HEATMAP_LAYER_ID]?.opacity).toBe(
      state[ATTENTION_HEATMAP_LAYER_ID]?.opacity,
    )
  })

  it('updates opacity independently of visibility', () => {
    const state = initialLayersState()
    const next = layersReducer(state, {
      type: 'SET_OPACITY',
      layerId: ATTENTION_HEATMAP_LAYER_ID,
      opacity: 0.3,
    })
    expect(next[ATTENTION_HEATMAP_LAYER_ID]?.opacity).toBe(0.3)
    expect(next[ATTENTION_HEATMAP_LAYER_ID]?.visible).toBe(true)
  })

  it('registers a new overlay layer with defaults only if not already present', () => {
    const state = initialLayersState()
    const withOverlay = layersReducer(state, {
      type: 'ENSURE_LAYER',
      layerId: 'overlay-1',
      defaultVisible: true,
    })
    expect(withOverlay['overlay-1']).toEqual({ visible: true, opacity: 0.85 })

    const afterToggle = layersReducer(withOverlay, {
      type: 'SET_VISIBLE',
      layerId: 'overlay-1',
      visible: false,
    })
    const ensuredAgain = layersReducer(afterToggle, {
      type: 'ENSURE_LAYER',
      layerId: 'overlay-1',
      defaultVisible: true,
    })
    // Existing state must not be clobbered by a second ENSURE_LAYER call.
    expect(ensuredAgain['overlay-1']?.visible).toBe(false)
  })

  it('sets visibility/opacity for a layer id that does not exist yet', () => {
    const state = initialLayersState()
    const next = layersReducer(state, {
      type: 'SET_VISIBLE',
      layerId: 'overlay-9',
      visible: true,
    })
    expect(next['overlay-9']).toEqual({ visible: true, opacity: 0.85 })
  })
})
