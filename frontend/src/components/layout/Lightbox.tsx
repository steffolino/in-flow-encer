import { useEffect, useRef, useState } from 'react'

interface LightboxProps {
  src: string
  alt: string
  onClose: () => void
}

interface Point {
  x: number
  y: number
}

const MIN_SCALE = 1
// The source images this is used for are fixed at 1536x1024px (AI-generated
// diagrams); "fit to screen" already renders near that native resolution on
// most desktop viewports, so anything past ~2x starts upscaling beyond the
// image's actual detail and looks soft/blurry rather than sharper. Capped
// here rather than left at a number that looks good in the abstract but
// produces a bad result for these specific images.
const MAX_SCALE = 2
const ZOOM_STEP = 0.25
const DOUBLE_CLICK_SCALE = 1.75

/**
 * A fullscreen overlay for viewing an enlarged, zoomable/pannable image —
 * these are dense infographics, so "bigger" alone isn't enough to read the
 * fine print. Supports scroll-wheel zoom, double-click to zoom, drag-to-pan,
 * touch pinch-to-zoom/one-finger pan, and +/- buttons for anyone not using
 * a mouse or touchscreen gesture. Closes on backdrop click, the close
 * button, or Escape.
 */
export function Lightbox({ src, alt, onClose }: LightboxProps): React.JSX.Element {
  const [scale, setScale] = useState(MIN_SCALE)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; startOffset: Point } | null>(null)
  const pinchRef = useRef<{ startDistance: number; startScale: number } | null>(null)
  const justDraggedRef = useRef(false)

  // A fresh image (or reopening) should always start at fit-to-screen, not
  // wherever the previous image was left zoomed/panned to.
  useEffect(() => {
    setScale(MIN_SCALE)
    setOffset({ x: 0, y: 0 })
  }, [src])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const clampScale = (value: number): number => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))

  const zoomBy = (delta: number): void => {
    setScale((prev) => {
      const next = clampScale(prev + delta)
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
      return next
    })
  }

  const resetZoom = (): void => {
    setScale(MIN_SCALE)
    setOffset({ x: 0, y: 0 })
  }

  const handleWheel = (event: React.WheelEvent<HTMLImageElement>): void => {
    event.preventDefault()
    zoomBy(event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP)
  }

  const handleDoubleClick = (event: React.MouseEvent<HTMLImageElement>): void => {
    event.stopPropagation()
    if (scale > MIN_SCALE) {
      resetZoom()
    } else {
      setScale(DOUBLE_CLICK_SCALE)
    }
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLImageElement>): void => {
    if (scale <= MIN_SCALE) return
    event.preventDefault()
    const startX = event.clientX
    const startY = event.clientY
    dragRef.current = { startX, startY, startOffset: offset }

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      if (!dragRef.current) return
      const dx = moveEvent.clientX - dragRef.current.startX
      const dy = moveEvent.clientY - dragRef.current.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) justDraggedRef.current = true
      setOffset({ x: dragRef.current.startOffset.x + dx, y: dragRef.current.startOffset.y + dy })
    }
    const handleMouseUp = (): void => {
      dragRef.current = null
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const touchDistance = (touches: React.TouchList): number => {
    const a = touches[0]
    const b = touches[1]
    if (!a || !b) return 0
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLImageElement>): void => {
    if (event.touches.length === 2) {
      pinchRef.current = { startDistance: touchDistance(event.touches), startScale: scale }
    } else if (event.touches.length === 1 && scale > MIN_SCALE) {
      const touch = event.touches[0]
      if (touch) dragRef.current = { startX: touch.clientX, startY: touch.clientY, startOffset: offset }
    }
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLImageElement>): void => {
    if (event.touches.length === 2 && pinchRef.current) {
      event.preventDefault()
      const distance = touchDistance(event.touches)
      if (distance > 0) {
        setScale(clampScale(pinchRef.current.startScale * (distance / pinchRef.current.startDistance)))
      }
    } else if (event.touches.length === 1 && dragRef.current) {
      event.preventDefault()
      const touch = event.touches[0]
      if (!touch) return
      const dx = touch.clientX - dragRef.current.startX
      const dy = touch.clientY - dragRef.current.startY
      setOffset({ x: dragRef.current.startOffset.x + dx, y: dragRef.current.startOffset.y + dy })
    }
  }

  const handleTouchEnd = (): void => {
    pinchRef.current = null
    dragRef.current = null
  }

  return (
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={() => {
        if (justDraggedRef.current) {
          justDraggedRef.current = false
          return
        }
        onClose()
      }}
    >
      <div
        className="lightbox-toolbar"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <button type="button" onClick={() => { zoomBy(-ZOOM_STEP) }} disabled={scale <= MIN_SCALE} aria-label="Zoom out">
          −
        </button>
        <span className="lightbox-zoom-level">{Math.round(scale * 100)}%</span>
        <button type="button" onClick={() => { zoomBy(ZOOM_STEP) }} disabled={scale >= MAX_SCALE} aria-label="Zoom in">
          +
        </button>
        {scale > MIN_SCALE && (
          <button type="button" className="lightbox-reset" onClick={resetZoom}>
            Reset
          </button>
        )}
      </div>

      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      <img
        src={src}
        alt={alt}
        className="lightbox-image"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          cursor: scale > MIN_SCALE ? 'grab' : 'zoom-in',
        }}
        onClick={(event) => {
          event.stopPropagation()
        }}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <p className="lightbox-hint">Scroll or pinch to zoom · drag to pan · double-click to reset</p>
    </div>
  )
}
