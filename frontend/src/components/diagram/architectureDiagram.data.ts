import { Boxes, Database, Layers, Network, Plug, Route, TrendingUp, Workflow } from 'lucide-react'
import type { DiagramItemData } from './diagramTypes'

export type ArchitectureNodeId =
  | 'api'
  | 'ingestion'
  | 'analytics'
  | 'overlays'
  | 'repositories'
  | 'domain'
  | 'postgis'
  | 'connector'

export interface ArchitectureNodeData extends DiagramItemData {
  id: ArchitectureNodeId
  lane: 'entry' | 'application' | 'data' | 'future'
}

export interface ArchitectureEdgeData {
  id: string
  source: ArchitectureNodeId
  target: ArchitectureNodeId
  future?: boolean
}

export const ARCHITECTURE_NODES: ArchitectureNodeData[] = [
  {
    id: 'api',
    lane: 'entry',
    label: 'API',
    detail:
      'Route handlers, tenant resolution via X-Tenant-Slug, and request/response schemas. Routes call repositories or application services; they never query the database directly.',
    icon: Route,
    accent: 'core',
  },
  {
    id: 'ingestion',
    lane: 'application',
    label: 'Ingestion',
    detail:
      'Canonical DTOs, social-content import, row-level validation, idempotency, and the deterministic place matcher.',
    icon: Workflow,
    accent: 'core',
  },
  {
    id: 'analytics',
    lane: 'application',
    label: 'Analytics',
    detail:
      'Attention aggregation and comparison logic turn persisted rows into place-level scores, thresholds, and plain-language statements.',
    icon: TrendingUp,
    accent: 'forecast',
  },
  {
    id: 'overlays',
    lane: 'application',
    label: 'Overlays',
    detail:
      'CSV and GeoJSON parsing plus overlay imports for customer-supplied visitor-flow data such as counters, parking, or protected areas.',
    icon: Layers,
    accent: 'overlay',
  },
  {
    id: 'repositories',
    lane: 'data',
    label: 'Repositories',
    detail:
      'The only layer that issues SQLAlchemy queries. Application services pass tenant ids into repositories so tenant isolation stays explicit.',
    icon: Boxes,
    accent: 'core',
  },
  {
    id: 'domain',
    lane: 'data',
    label: 'Domain',
    detail:
      'SQLAlchemy ORM models are the domain entities for tenancy, sources, locations, social content, and overlays.',
    icon: Network,
    accent: 'core',
  },
  {
    id: 'postgis',
    lane: 'data',
    label: 'PostGIS',
    detail:
      'PostgreSQL with PostGIS stores SRID 4326 geometries, with GIST indexes ready for spatial queries as data volume grows.',
    icon: Database,
    accent: 'core',
  },
  {
    id: 'connector',
    lane: 'future',
    label: 'Connector',
    detail:
      'A Protocol for future pull-based sources such as municipal APIs or sensor feeds. Only the local fixture connector exists today.',
    icon: Plug,
    accent: 'future',
    badgeLabel: 'Not built',
  },
]

export const ARCHITECTURE_EDGES: ArchitectureEdgeData[] = [
  { id: 'api-ingestion', source: 'api', target: 'ingestion' },
  { id: 'api-analytics', source: 'api', target: 'analytics' },
  { id: 'api-overlays', source: 'api', target: 'overlays' },
  { id: 'ingestion-repositories', source: 'ingestion', target: 'repositories' },
  { id: 'analytics-repositories', source: 'analytics', target: 'repositories' },
  { id: 'overlays-repositories', source: 'overlays', target: 'repositories' },
  { id: 'repositories-domain', source: 'repositories', target: 'domain' },
  { id: 'domain-postgis', source: 'domain', target: 'postgis' },
  { id: 'connector-overlays', source: 'connector', target: 'overlays', future: true },
]
