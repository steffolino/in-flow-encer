import { z } from 'zod'
import { tenantListSchema, placeListSchema, socialContentItemSchema, overlayLayerListSchema,
  overlayFeatureCollectionSchema, type AttentionCell, type AttentionResponse,
  type ForecastResponse, type ComparisonResponse } from './schemas'

export const isStaticDemo = import.meta.env.VITE_STATIC_DEMO === 'true'
export const demoSnapshotSchema = z.object({
  version: z.literal(1),
  exported_at: z.string(),
  tenants: tenantListSchema,
  places: placeListSchema,
  data: z.record(z.object({
    items: z.array(socialContentItemSchema.extend({ source_id: z.string() })),
    overlays: overlayLayerListSchema,
    features: z.record(overlayFeatureCollectionSchema),
    flow: z.record(z.number()),
  })),
})
export type DemoSnapshot = z.infer<typeof demoSnapshotSchema>
type TenantData = DemoSnapshot['data'][string]
const weights = { post_count: 0.4, reach: 0.35, engagement: 0.25 }
const round = (value: number, digits = 4) => Number(value.toFixed(digits))
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length

function filtered(snapshot: DemoSnapshot, data: TenantData, query: URLSearchParams) {
  const region = query.get('region')
  const from = query.get('date_from'), to = query.get('date_to')
  const places = new Set(snapshot.places.filter(p => !region || p.region === region).map(p => p.id))
  return data.items.filter(item => {
    const date = Date.parse(item.published_at)
    return (!from || date >= Date.parse(from)) &&
      (!to || date <= Date.parse(to)) &&
      (!query.get('platform') || item.platform === query.get('platform')) &&
      (!query.get('source_id') || item.source_id === query.get('source_id')) &&
      (!query.get('author_category') || item.author_category === query.get('author_category')) &&
      (!region || item.location_matches?.some(m => places.has(m.place_id)))
  }).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
}

function attention(snapshot: DemoSnapshot, data: TenantData, query: URLSearchParams): AttentionResponse {
  const current = filtered(snapshot, data, query).slice(0, 10_000)
  const previousCounts = new Map<string, number>()
  const from = query.get('date_from'), to = query.get('date_to')
  if (from && to) {
    const previousQuery = new URLSearchParams(query)
    previousQuery.set('date_from', new Date(2 * Date.parse(from) - Date.parse(to)).toISOString())
    previousQuery.set('date_to', from)
    for (const item of filtered(snapshot, data, previousQuery).slice(0, 10_000)) {
      for (const match of item.location_matches ?? []) {
        previousCounts.set(match.place_id, (previousCounts.get(match.place_id) ?? 0) + 1)
      }
    }
  }
  const buckets = new Map<string, { items: TenantData['items']; confidences: number[] }>()
  for (const item of current) {
    for (const match of item.location_matches ?? []) {
      const bucket = buckets.get(match.place_id) ?? { items: [], confidences: [] }
      bucket.items.push(item)
      bucket.confidences.push(match.confidence)
      buckets.set(match.place_id, bucket)
    }
  }
  const cells: AttentionCell[] = []
  for (const [id, bucket] of buckets) {
    const place = snapshot.places.find(p => p.id === id)
    if (!place) continue
    const count = bucket.items.length, previous = previousCounts.get(id) ?? 0
    cells.push({ place_id: id, place_name: place.name, lon: place.lon, lat: place.lat,
      post_count: count, total_reach: bucket.items.reduce((n, i) => n + (i.estimated_reach ?? 0), 0),
      total_engagement: bucket.items.reduce((n, i) => n + (i.engagement_count ?? 0), 0),
      unique_creators: new Set(bucket.items.map(i => i.author_name).filter(Boolean)).size,
      avg_confidence: round(mean(bucket.confidences), 3), attention_score: 0,
      change_vs_previous_period: from && to ? (previous ? round((count - previous) / previous * 100, 1) : 100) : null,
    })
  }
  for (const [key, weight] of [['post_count', weights.post_count], ['total_reach', weights.reach],
    ['total_engagement', weights.engagement]] as const) {
    const values = cells.map(c => c[key]), low = Math.min(...values), high = Math.max(...values)
    for (const cell of cells) cell.attention_score += weight * (high === low ? (high > 0 ? 1 : 0) : (cell[key] - low) / (high - low))
  }
  for (const cell of cells) cell.attention_score = round(cell.attention_score)
  return { generated_at: snapshot.exported_at, weights, cells: cells.sort((a, b) => b.attention_score - a.attention_score) }
}

function forecast(result: AttentionResponse): ForecastResponse {
  return { generated_at: result.generated_at,
    method: 'forecast_score = attention_score * (1 + change_vs_previous_period / 100); no machine learning, see docs/adr/0008-naive-trend-forecast.md',
    not_yet_connected: ['weather', 'events/ticketing', 'mobile/location data'],
    cells: result.cells.map((cell): ForecastResponse['cells'][number] => {
      const confidence = cell.post_count >= 10 ? 'high' : cell.post_count >= 3 ? 'medium' : 'low'
      const score = Math.max(0, round(cell.attention_score * (1 + (cell.change_vs_previous_period ?? 0) / 100)))
      const spread = { high: 0.1, medium: 0.25, low: 0.5 }[confidence] * score
      return { place_id: cell.place_id, place_name: cell.place_name, lon: cell.lon, lat: cell.lat,
        attention_score: cell.attention_score, forecast_score: score,
        forecast_score_low: round(Math.max(0, score - spread)), forecast_score_high: round(score + spread),
        trend_pct: cell.change_vs_previous_period, confidence, drivers: weights }
    }).sort((a, b) => b.forecast_score - a.forecast_score),
  }
}

function comparison(result: AttentionResponse, data: TenantData): ComparisonResponse {
  if (!result.cells.length) return { thresholds: { attention_mean: null, visitor_flow_mean: null }, items: [] }
  const average = mean(result.cells.map(c => c.attention_score))
  const values = result.cells.map(c => data.flow[c.place_id]).filter((v): v is number => v !== undefined)
  const flowMean = values.length ? mean(values) : null
  return { thresholds: { attention_mean: round(average), visitor_flow_mean: flowMean },
    items: result.cells.map(cell => {
      const level = cell.attention_score >= average ? 'high' : 'low'
      const value = data.flow[cell.place_id]
      const flow = value === undefined || flowMean === null ? 'unknown' : value >= flowMean ? 'high' : 'low'
      const statements = {
        high: { high: 'High social attention and high visitor-flow values', low: 'High social attention and low measured visitor flow', unknown: 'High social attention; no visitor-flow data available for comparison' },
        low: { high: 'Low social attention and high visitor-flow values', low: 'Low social attention and low visitor-flow values', unknown: 'Low social attention; no visitor-flow data available for comparison' },
      }
      return { place_id: cell.place_id, place_name: cell.place_name, attention_level: level,
        visitor_flow_level: flow, statement: statements[level][flow] }
    }),
  }
}

/** Resolve the existing read API contract against a public, immutable snapshot. */
export function resolveDemo(snapshot: DemoSnapshot, path: string, slug: string | null): Response {
  const url = new URL(path, 'https://demo.local'), route = url.pathname, query = url.searchParams
  if (route === '/tenants') return Response.json(snapshot.tenants)
  if (route === '/places') return Response.json(snapshot.places)
  const tenant = snapshot.tenants.find(t => t.slug === slug)
  const data = tenant ? snapshot.data[tenant.slug] : undefined
  if (!data) return Response.json({ error: { code: 'not_found', message: 'Unknown demo tenant' } }, { status: 404 })
  if (route === '/social-content') {
    const items = filtered(snapshot, data, query)
    const offset = Math.max(0, Number(query.get('offset') ?? 0)), limit = Math.min(500, Math.max(1, Number(query.get('limit') ?? 100)))
    return Response.json({ items: items.slice(offset, offset + limit), total: items.length })
  }
  if (route === '/overlays') return Response.json(data.overlays)
  const overlay = /^\/overlays\/([^/]+)\/features$/.exec(route)
  if (overlay?.[1] && data.overlays.some(layer => layer.id === overlay[1])) return Response.json(data.features[overlay[1]])
  if (route.startsWith('/analytics/')) {
    query.delete('author_category')
    if (route === '/analytics/comparison') { query.delete('platform'); query.delete('source_id') }
    const result = attention(snapshot, data, query)
    if (route === '/analytics/attention') return Response.json(result)
    if (route === '/analytics/forecast') return Response.json(forecast(result))
    if (route === '/analytics/comparison') return Response.json(comparison(result, data))
  }
  return Response.json({ error: { code: 'not_found', message: 'Demo resource not found' } }, { status: 404 })
}

let snapshotPromise: Promise<DemoSnapshot> | undefined
export async function demoRequest(path: string, slug: string | null, method = 'GET'): Promise<Response> {
  if (method !== 'GET') return Response.json({ error: { code: 'read_only_demo', message: 'This demo uses a read-only data snapshot. Imports and edits are available in the local backend.' } }, { status: 405 })
  snapshotPromise ??= fetch('/demo/snapshot.json').then(async response => {
    if (!response.ok) throw new Error('Could not load demo data')
    return demoSnapshotSchema.parse(await response.json())
  }).catch((error: unknown) => { snapshotPromise = undefined; throw error })
  return resolveDemo(await snapshotPromise, path, slug)
}
