import type { ReactNode } from 'react'

interface MobileSheetProps {
  title: string
  onClose: () => void
  onBack?: () => void
  children: ReactNode
}

export function MobileSheet({ title, onClose, onBack, children }: MobileSheetProps): React.JSX.Element {
  return (
    <div className="mobile-sheet-backdrop" onClick={onClose}>
      <div
        className="mobile-sheet"
        role="dialog"
        aria-label={title}
        onClick={(event) => { event.stopPropagation(); }}
      >
        <div className="mobile-sheet-header">
          {onBack ? (
            <button type="button" className="link-button mobile-sheet-back" onClick={onBack}>
              ‹ Back
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="mobile-sheet-close" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        </div>
        <div className="mobile-sheet-body">{children}</div>
      </div>
    </div>
  )
}
