import { describe, expect, it } from 'vitest'
import { computeDashboardSummary } from './summary'
import type { AttentionCell, OverlayLayer } from '../api/schemas'

function makeCell(overrides: Partial<AttentionCell>): AttentionCell {
  return {
    place_id: 'p1',
    place_name: 'Eibsee',
    lon: 11.1,
    lat: 47.5,
    post_count: 10,
    total_reach: 1000,
    total_engagement: 100,
    unique_creators: 5,
    change_vs_previous_period: null,
    avg_confidence: 0.9,
    attention_score: 0.5,
    ...overrides,
  }
}

function makeOverlay(overrides: Partial<OverlayLayer>): OverlayLayer {
  return {
    id: 'ov1',
    name: 'Overlay 1',
    description: null,
    geometry_type: 'Point',
    measurement_type: 'pedestrian_count',
    unit: 'people/hour',
    visibility: 'visible',
    time_field: null,
    source: { name: 'Test source', provider: null, last_updated_at: null },
    feature_count: 10,
    ...overrides,
  }
}

describe('computeDashboardSummary', () => {
  it('sums reach and unique creators across cells', () => {
    const cells = [
      makeCell({ place_id: 'a', total_reach: 100, unique_creators: 2 }),
      makeCell({ place_id: 'b', total_reach: 300, unique_creators: 4 }),
    ]
    const summary = computeDashboardSummary(cells, 42, [], {})
    expect(summary.postsInPeriod).toBe(42)
    expect(summary.estimatedReach).toBe(400)
    expect(summary.uniqueCreators).toBe(6)
    expect(summary.placesMentioned).toBe(2)
  })

  it('excludes places with zero posts from placesMentioned', () => {
    const cells = [makeCell({ post_count: 0 }), makeCell({ place_id: 'b', post_count: 3 })]
    const summary = computeDashboardSummary(cells, 3, [], {})
    expect(summary.placesMentioned).toBe(1)
  })

  it('finds the strongest rising location, ignoring cells without prior-period data', () => {
    const cells = [
      makeCell({ place_id: 'a', place_name: 'Eibsee', change_vs_previous_period: 0.1 }),
      makeCell({ place_id: 'b', place_name: 'Zugspitze', change_vs_previous_period: 0.4 }),
      makeCell({ place_id: 'c', place_name: 'Walchensee', change_vs_previous_period: null }),
    ]
    const summary = computeDashboardSummary(cells, 0, [], {})
    expect(summary.strongestRising).toEqual({ placeName: 'Zugspitze', change: 0.4 })
  })

  it('returns null strongestRising when no cell has prior-period data', () => {
    const cells = [makeCell({ change_vs_previous_period: null })]
    const summary = computeDashboardSummary(cells, 0, [], {})
    expect(summary.strongestRising).toBeNull()
  })

  it('counts active overlays using layer state when present, falling back to server visibility', () => {
    const overlays = [makeOverlay({ id: 'ov1', visibility: 'visible' }), makeOverlay({ id: 'ov2', visibility: 'hidden' })]
    const summaryNoLayerState = computeDashboardSummary([], 0, overlays, {})
    expect(summaryNoLayerState.activeOverlayCount).toBe(1)

    const summaryWithOverride = computeDashboardSummary([], 0, overlays, {
      ov2: { visible: true, opacity: 1 },
    })
    expect(summaryWithOverride.activeOverlayCount).toBe(2)
  })
})
