import type { ReactNode } from 'react'

interface FloatingPanelProps {
  title: string
  side: 'left' | 'right'
  onClose: () => void
  children: ReactNode
}

export function FloatingPanel({ title, side, onClose, children }: FloatingPanelProps): React.JSX.Element {
  return (
    <div className={`hud-panel hud-panel-${side}`} role="dialog" aria-label={title}>
      <div className="hud-panel-header">
        <button
          type="button"
          className="hud-panel-close"
          onClick={onClose}
          aria-label={`Close ${title}`}
        >
          ✕
        </button>
      </div>
      <div className="hud-panel-body">{children}</div>
    </div>
  )
}
