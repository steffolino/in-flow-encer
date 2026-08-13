import type { LucideIcon } from 'lucide-react'
import type { DiagramAccent } from './diagramTypes'

interface DetailPanelProps {
  eyebrow?: string
  label: string
  detail: string
  icon: LucideIcon
  accent: DiagramAccent
  badgeLabel?: string
}

export function DetailPanel({ eyebrow, label, detail, icon: Icon, accent, badgeLabel }: DetailPanelProps): React.JSX.Element {
  return (
    <div className={`detail-panel detail-panel--${accent}`} role="status">
      <span className="detail-panel-icon" aria-hidden="true">
        <Icon size={20} strokeWidth={2} />
      </span>
      <div className="detail-panel-body">
        <div className="detail-panel-head">
          {eyebrow && <span className="detail-panel-eyebrow">{eyebrow}</span>}
          {badgeLabel && <span className={`badge badge-${accent}`}>{badgeLabel}</span>}
        </div>
        <p className="detail-panel-title">{label}</p>
        <p className="detail-panel-text">{detail}</p>
      </div>
    </div>
  )
}
