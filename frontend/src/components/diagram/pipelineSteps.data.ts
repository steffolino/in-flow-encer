import {
  Crosshair,
  Database,
  Layers,
  LayoutGrid,
  Map,
  MessageCircle,
  TrendingUp,
  Upload,
} from 'lucide-react'
import type { DiagramItemData } from './diagramTypes'

export interface PipelineStepData extends DiagramItemData {
  sequence: string
}

export const PRIMARY_STEPS: PipelineStepData[] = [
  {
    id: 'social-input',
    sequence: '01',
    label: 'Social signal',
    detail: 'Fixture/API social-content import; synthetic in this pilot, but shaped like a real public attention source.',
    icon: MessageCircle,
    accent: 'observational',
  },
  {
    id: 'matching',
    sequence: '02',
    label: 'Place match',
    detail:
      'A fixed-order cascade over coordinates, structured location text, captions, aliases, and hashtags. Ambiguous mentions are left unresolved rather than guessed.',
    icon: Crosshair,
    accent: 'core',
  },
  {
    id: 'storage',
    sequence: '03',
    label: 'Tenant storage',
    detail: 'PostGIS persistence with tenant-scoped social content, sources, overlay layers, and overlay features.',
    icon: Database,
    accent: 'core',
  },
  {
    id: 'aggregation',
    sequence: '04',
    label: 'Attention score',
    detail: 'Per place, post count, reach, and engagement are min-max normalised and combined into attention_score.',
    icon: LayoutGrid,
    accent: 'core',
  },
  {
    id: 'forecast',
    sequence: '05',
    label: 'Trend forecast',
    detail:
      'A transparent near-term projection uses period-over-period attention change. It is a formula, not a trained machine-learning model.',
    icon: TrendingUp,
    accent: 'forecast',
    badgeLabel: 'Projected',
  },
]

export const SECONDARY_STEPS: PipelineStepData[] = [
  {
    id: 'upload-input',
    sequence: 'A',
    label: 'Visitor data',
    detail: 'Customer CSV/GeoJSON uploads carry observed visitor-flow data such as counters, parking, transit, or protected areas.',
    icon: Upload,
    accent: 'overlay',
  },
  {
    id: 'overlay-layer',
    sequence: 'B',
    label: 'Map overlay',
    detail: 'Uploaded visitor-flow geometry is rendered as its own layer and kept visually distinct from social attention.',
    icon: Layers,
    accent: 'overlay',
  },
]

export const MERGE_STEP: PipelineStepData = {
  id: 'map-filters',
  sequence: '06',
  label: 'Shared map',
  detail:
    'Attention, forecast, and visitor-flow overlays converge on one MapLibre view with shared filters and a comparison panel.',
  icon: Map,
  accent: 'core',
}
