import { describe, expect, it } from 'vitest'
import { filtersReducer, initialFilters } from './filters'

describe('filtersReducer', () => {
  it('sets the date-from value', () => {
    const state = initialFilters()
    const next = filtersReducer(state, { type: 'SET_DATE_FROM', value: '2026-01-01' })
    expect(next.dateFrom).toBe('2026-01-01')
    expect(next.dateTo).toBe(state.dateTo)
  })

  it('sets the date-to value', () => {
    const state = initialFilters()
    const next = filtersReducer(state, { type: 'SET_DATE_TO', value: '2026-02-01' })
    expect(next.dateTo).toBe('2026-02-01')
  })

  it('sets platform, region, source id and author category independently', () => {
    let state = initialFilters()
    state = filtersReducer(state, { type: 'SET_PLATFORM', value: 'instagram' })
    state = filtersReducer(state, { type: 'SET_REGION', value: 'Eibsee' })
    state = filtersReducer(state, { type: 'SET_SOURCE_ID', value: 'src_1' })
    state = filtersReducer(state, { type: 'SET_AUTHOR_CATEGORY', value: 'visitor' })

    expect(state).toMatchObject({
      platform: 'instagram',
      region: 'Eibsee',
      sourceId: 'src_1',
      authorCategory: 'visitor',
    })
  })

  it('resets all fields back to defaults', () => {
    let state = initialFilters()
    state = filtersReducer(state, { type: 'SET_PLATFORM', value: 'tiktok' })
    state = filtersReducer(state, { type: 'SET_REGION', value: 'Tegernsee' })

    const reset = filtersReducer(state, { type: 'RESET' })

    expect(reset.platform).toBe('')
    expect(reset.region).toBe('')
    expect(reset).toEqual(initialFilters())
  })

  it('never mutates the previous state object', () => {
    const state = initialFilters()
    const next = filtersReducer(state, { type: 'SET_PLATFORM', value: 'facebook' })
    expect(next).not.toBe(state)
    expect(state.platform).toBe('')
  })
})
