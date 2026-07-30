import type { Feature, FeatureCollection, Point } from 'geojson'
import type { AttentionCell, Place, SocialContentItem } from '../api/schemas'

export interface AttentionPointProperties {
  place_id: string
  place_name: string
  attention_score: number
  post_count: number
  total_reach: number
  total_engagement: number
  unique_creators: number
}

/** Builds the point FeatureCollection the heatmap layer sources from. */
export function attentionCellsToGeoJSON(
  cells: AttentionCell[],
): FeatureCollection<Point, AttentionPointProperties> {
  const features: Feature<Point, AttentionPointProperties>[] = cells.map((cell) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [cell.lon, cell.lat] },
    properties: {
      place_id: cell.place_id,
      place_name: cell.place_name,
      attention_score: cell.attention_score,
      post_count: cell.post_count,
      total_reach: cell.total_reach,
      total_engagement: cell.total_engagement,
      unique_creators: cell.unique_creators,
    },
  }))
  return { type: 'FeatureCollection', features }
}

export interface SocialPointProperties {
  post_id: string
  platform: string
  place_name: string
  confidence: number
  method: string
  author_category: string | null
}

/**
 * Plots one point per social-content item at its highest-confidence matched
 * place. Items with no location match are omitted (they can't be placed on
 * a map); this is a known limitation surfaced in the layer's legend text.
 */
export function socialContentToGeoJSON(
  items: SocialContentItem[],
  places: Place[],
): FeatureCollection<Point, SocialPointProperties> {
  const placeById = new Map(places.map((place) => [place.id, place]))
  const features: Feature<Point, SocialPointProperties>[] = []

  for (const item of items) {
    const matches = item.location_matches ?? []
    if (matches.length === 0) continue
    const bestMatch = matches.reduce((best, match) =>
      match.confidence > best.confidence ? match : best,
    )
    const place = placeById.get(bestMatch.place_id)
    if (!place) continue
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [place.lon, place.lat] },
      properties: {
        post_id: item.id,
        platform: item.platform,
        place_name: bestMatch.place_name,
        confidence: bestMatch.confidence,
        method: bestMatch.method,
        author_category: item.author_category ?? null,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}
