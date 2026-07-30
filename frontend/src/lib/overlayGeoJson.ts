import type { FeatureCollection, Geometry } from 'geojson'
import type { OverlayFeatureCollection, OverlayFeatureProperties } from '../api/schemas'

/** Adapts our validated overlay feature collection to the plain `geojson` types maplibre-gl expects. */
export function overlayFeatureCollectionToGeoJSON(
  featureCollection: OverlayFeatureCollection,
): FeatureCollection<Geometry, OverlayFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: featureCollection.features.map((feature) => ({
      type: 'Feature',
      geometry: feature.geometry,
      properties: feature.properties,
    })),
  }
}
