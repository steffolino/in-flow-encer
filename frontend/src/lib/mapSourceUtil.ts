import { GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl'
import type { GeoJSON } from 'geojson'

/** Updates a GeoJSON source's data if the source exists and is a GeoJSON source. */
export function setGeoJsonSourceData(map: MapLibreMap, sourceId: string, data: GeoJSON): void {
  const source = map.getSource(sourceId)
  if (source instanceof GeoJSONSource) {
    source.setData(data)
  }
}
