import type { LucideIcon } from 'lucide-react'

export type DiagramAccent = 'observational' | 'overlay' | 'core' | 'forecast' | 'future'

export interface DiagramItemData {
  id: string
  /** Shown directly in the diagram. Keep it short and glanceable. */
  label: string
  /** Longer explanation, revealed in DetailPanel when the item is selected. */
  detail: string
  icon: LucideIcon
  accent: DiagramAccent
  /** Optional small pill, e.g. "Not built yet"; only shown where it adds information. */
  badgeLabel?: string
}
