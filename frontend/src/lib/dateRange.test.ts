import { describe, expect, it } from 'vitest'
import { pilotWindowMonths } from './dateRange'

describe('pilotWindowMonths', () => {
  it('covers the pilot demo window month by month, in order', () => {
    const months = pilotWindowMonths()
    expect(months).toHaveLength(5)
    expect(months[0]).toMatchObject({ label: 'April 2026', from: '2026-04-01', to: '2026-04-30' })
    expect(months[months.length - 1]).toMatchObject({
      label: 'August 2026',
      from: '2026-08-01',
      to: '2026-08-31',
    })
  })

  it('produces contiguous, non-overlapping month boundaries', () => {
    const months = pilotWindowMonths()
    expect(months.map((m) => [m.from, m.to])).toEqual([
      ['2026-04-01', '2026-04-30'],
      ['2026-05-01', '2026-05-31'],
      ['2026-06-01', '2026-06-30'],
      ['2026-07-01', '2026-07-31'],
      ['2026-08-01', '2026-08-31'],
    ])
  })
})
