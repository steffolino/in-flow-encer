import type { AttentionCell } from '../api/schemas'
import type { OverlayLayer } from '../api/schemas'
import type { LayersState } from '../state/layers'

export interface RisingLocation {
  placeName: string
  change: number
}

export interface DashboardSummary {
  postsInPeriod: number
  placesMentioned: number
  uniqueCreators: number
  estimatedReach: number
  strongestRising: RisingLocation | null
  activeOverlayCount: number
}

/**
 * Aggregates the dashboard summary strip from already-fetched query
 * results. Kept as a pure function (not inline in a component) so it can
 * be unit tested without mounting the map or the network layer.
 *
 * Notes on the numbers:
 * - `postsInPeriod` comes straight from the social-content endpoint's
 *   `total`, since that reflects the filtered result set directly.
 * - `uniqueCreators` sums the per-place `unique_creators` counts from the
 *   attention endpoint; a creator posting about two places is counted
 *   twice. This is a known approximation - the backend does not expose a
 *   single tenant-wide distinct-creator count.
 */
export function computeDashboardSummary(
  cells: AttentionCell[],
  postsInPeriod: number,
  overlays: OverlayLayer[],
  layersState: LayersState,
): DashboardSummary {
  const placesMentioned = cells.filter((cell) => cell.post_count > 0).length
  const uniqueCreators = cells.reduce((sum, cell) => sum + cell.unique_creators, 0)
  const estimatedReach = cells.reduce((sum, cell) => sum + cell.total_reach, 0)

  let strongestRising: RisingLocation | null = null
  for (const cell of cells) {
    if (cell.change_vs_previous_period === null || cell.change_vs_previous_period === undefined) {
      continue
    }
    if (!strongestRising || cell.change_vs_previous_period > strongestRising.change) {
      strongestRising = { placeName: cell.place_name, change: cell.change_vs_previous_period }
    }
  }

  const activeOverlayCount = overlays.filter((overlay) => {
    const state = layersState[overlay.id]
    return state ? state.visible : overlay.visibility === 'visible'
  }).length

  return {
    postsInPeriod,
    placesMentioned,
    uniqueCreators,
    estimatedReach,
    strongestRising,
    activeOverlayCount,
  }
}
