/**
 * Single source of truth for API response shapes.
 *
 * Every resource returned by the backend is validated at the network
 * boundary with a Zod schema and its TypeScript type is inferred from
 * that schema (never hand-duplicated). If the backend's real response
 * shape differs from this contract once it is available, only this file
 * (plus `client.ts`) should need to change.
 */
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Tenants
// ---------------------------------------------------------------------------
export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  created_at: z.string(),
})
export type Tenant = z.infer<typeof tenantSchema>
export const tenantListSchema = z.array(tenantSchema)

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------
export const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  place_type: z.string(),
  municipality: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  aliases: z.array(z.string()).optional(),
  lon: z.number(),
  lat: z.number(),
})
export type Place = z.infer<typeof placeSchema>
export const placeListSchema = z.array(placeSchema)

// ---------------------------------------------------------------------------
// Import reports (shared shape for social-content and overlay imports)
// ---------------------------------------------------------------------------
export const importWarningSchema = z.object({
  row: z.number(),
  message: z.string(),
})
export type ImportWarning = z.infer<typeof importWarningSchema>

export const importReportSchema = z.object({
  received: z.number(),
  created: z.number(),
  updated: z.number(),
  skipped: z.number(),
  invalid: z.number(),
  duplicates: z.number(),
  warnings: z.array(importWarningSchema),
})
export type ImportReport = z.infer<typeof importReportSchema>

// ---------------------------------------------------------------------------
// Social content
// ---------------------------------------------------------------------------
export const locationMatchSchema = z.object({
  place_id: z.string(),
  place_name: z.string(),
  method: z.string(),
  confidence: z.number(),
  matched_text: z.string().nullable().optional(),
})
export type LocationMatch = z.infer<typeof locationMatchSchema>

export const socialContentItemSchema = z.object({
  id: z.string(),
  platform: z.string(),
  author_name: z.string().nullable().optional(),
  author_category: z.string().nullable().optional(),
  published_at: z.string(),
  caption: z.string().nullable().optional(),
  hashtags: z.array(z.string()).optional(),
  content_url: z.string().nullable().optional(),
  engagement_count: z.number().nullable().optional(),
  estimated_reach: z.number().nullable().optional(),
  location_text: z.string().nullable().optional(),
  location_matches: z.array(locationMatchSchema).optional(),
})
export type SocialContentItem = z.infer<typeof socialContentItemSchema>

export const socialContentPageSchema = z.object({
  items: z.array(socialContentItemSchema),
  total: z.number(),
})
export type SocialContentPage = z.infer<typeof socialContentPageSchema>

// ---------------------------------------------------------------------------
// Social content import (client-side fixture -> POST /social-content/import)
// ---------------------------------------------------------------------------
export const socialContentImportItemSchema = z.object({
  platform: z.string().min(1),
  author_name: z.string().optional(),
  author_category: z.string().optional(),
  published_at: z.string().min(1),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  content_url: z.string().optional(),
  engagement_count: z.number().optional(),
  estimated_reach: z.number().optional(),
  location_text: z.string().optional(),
})
export type SocialContentImportItem = z.infer<typeof socialContentImportItemSchema>

export const socialContentImportItemsSchema = z.array(socialContentImportItemSchema)

// ---------------------------------------------------------------------------
// Analytics: attention
// ---------------------------------------------------------------------------
export const attentionCellSchema = z.object({
  place_id: z.string(),
  place_name: z.string(),
  lon: z.number(),
  lat: z.number(),
  post_count: z.number(),
  total_reach: z.number(),
  total_engagement: z.number(),
  unique_creators: z.number(),
  change_vs_previous_period: z.number().nullable().optional(),
  avg_confidence: z.number().nullable().optional(),
  attention_score: z.number(),
})
export type AttentionCell = z.infer<typeof attentionCellSchema>

export const attentionResponseSchema = z.object({
  generated_at: z.string(),
  weights: z.object({
    post_count: z.number(),
    reach: z.number(),
    engagement: z.number(),
  }),
  cells: z.array(attentionCellSchema),
})
export type AttentionResponse = z.infer<typeof attentionResponseSchema>

// ---------------------------------------------------------------------------
// Analytics: comparison
// ---------------------------------------------------------------------------
export const attentionLevelSchema = z.union([z.literal('high'), z.literal('low')])
export type AttentionLevel = z.infer<typeof attentionLevelSchema>

export const visitorFlowLevelSchema = z.union([
  z.literal('high'),
  z.literal('low'),
  z.literal('unknown'),
])
export type VisitorFlowLevel = z.infer<typeof visitorFlowLevelSchema>

export const comparisonItemSchema = z.object({
  place_id: z.string(),
  place_name: z.string(),
  attention_level: attentionLevelSchema,
  visitor_flow_level: visitorFlowLevelSchema,
  statement: z.string(),
})
export type ComparisonItem = z.infer<typeof comparisonItemSchema>

export const comparisonResponseSchema = z.object({
  thresholds: z.record(z.string(), z.unknown()),
  items: z.array(comparisonItemSchema),
})
export type ComparisonResponse = z.infer<typeof comparisonResponseSchema>

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------
export const overlayGeometryTypeSchema = z.union([
  z.literal('Point'),
  z.literal('LineString'),
  z.literal('Polygon'),
])
export type OverlayGeometryType = z.infer<typeof overlayGeometryTypeSchema>

export const overlayVisibilitySchema = z.union([z.literal('visible'), z.literal('hidden')])
export type OverlayVisibility = z.infer<typeof overlayVisibilitySchema>

export const overlaySourceSchema = z.object({
  name: z.string(),
  provider: z.string().nullable().optional(),
  last_updated_at: z.string().nullable().optional(),
})
export type OverlaySource = z.infer<typeof overlaySourceSchema>

export const overlayLayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  geometry_type: overlayGeometryTypeSchema,
  measurement_type: z.string(),
  unit: z.string().nullable().optional(),
  visibility: overlayVisibilitySchema,
  time_field: z.string().nullable().optional(),
  source: overlaySourceSchema,
  feature_count: z.number(),
})
export type OverlayLayer = z.infer<typeof overlayLayerSchema>
export const overlayLayerListSchema = z.array(overlayLayerSchema)

// GeoJSON FeatureCollection returned by /overlays/{id}/features. We rely on
// the well-known `geojson` type definitions for the geometry itself and only
// validate the envelope + the properties bag we actually read.
export const overlayFeaturePropertiesSchema = z
  .object({
    value: z.number().nullable().optional(),
    observed_at: z.string().nullable().optional(),
    external_id: z.string().nullable().optional(),
  })
  .passthrough()
export type OverlayFeatureProperties = z.infer<typeof overlayFeaturePropertiesSchema>

// GeoJSON geometry union restricted to the geometry types the overlay
// endpoint can produce (Point / LineString / Polygon), matching
// `OverlayGeometryType` above. Coordinates are validated structurally but
// left as `number[]` nesting since depth differs per geometry type.
export const overlayGeometrySchema = z.union([
  z.object({ type: z.literal('Point'), coordinates: z.tuple([z.number(), z.number()]) }),
  z.object({ type: z.literal('LineString'), coordinates: z.array(z.tuple([z.number(), z.number()])) }),
  z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
  }),
])
export type OverlayGeometry = z.infer<typeof overlayGeometrySchema>

export const overlayFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: overlayGeometrySchema,
  properties: overlayFeaturePropertiesSchema,
})
export type OverlayFeature = z.infer<typeof overlayFeatureSchema>

export const overlayFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(overlayFeatureSchema),
})
export type OverlayFeatureCollection = z.infer<typeof overlayFeatureCollectionSchema>

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
export const healthSchema = z.object({ status: z.string() })
export type Health = z.infer<typeof healthSchema>

// ---------------------------------------------------------------------------
// API error envelope
// ---------------------------------------------------------------------------
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type ApiErrorBody = z.infer<typeof apiErrorSchema>
