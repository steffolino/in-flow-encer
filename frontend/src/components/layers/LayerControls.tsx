import {
  ATTENTION_LEGEND_STOPS,
  OVERLAY_GEOMETRY_COLORS,
  OVERLAY_GEOMETRY_LABELS,
  SOCIAL_POINT_COLOR,
} from '../../lib/colors'
import { formatDateTime } from '../../lib/format'
import { usePatchOverlay } from '../../api/useOverlayMutations'
import {
  ATTENTION_HEATMAP_LAYER_ID,
  SOCIAL_POINTS_LAYER_ID,
  defaultLayerState,
  useLayers,
} from '../../state/layers'
import type { OverlayLayer } from '../../api/schemas'

interface LayerControlsProps {
  overlays: OverlayLayer[]
}

export function LayerControls({ overlays }: LayerControlsProps): React.JSX.Element {
  const { layers, dispatch } = useLayers()
  const patchOverlay = usePatchOverlay()

  return (
    <section className="panel" aria-labelledby="layers-heading">
      <h2 id="layers-heading">Map layers</h2>

      <div className="layer-row">
        <div className="layer-row-head">
          <span className="badge badge-observational">Social attention</span>
        </div>
        <h3>Attention markers &amp; heatmap</h3>
        <VisibilityAndOpacity
          layerId={ATTENTION_HEATMAP_LAYER_ID}
          state={layers[ATTENTION_HEATMAP_LAYER_ID] ?? defaultLayerState()}
          dispatch={dispatch}
        />
        <ul className="legend-list" aria-label="Attention heatmap legend">
          {ATTENTION_LEGEND_STOPS.map((stop) => (
            <li key={stop.label} className="legend-item">
              <span className="legend-swatch" style={{ background: stop.color }} aria-hidden="true" />
              {stop.label}
            </li>
          ))}
        </ul>
        <p className="layer-meta">
          Each place is marked with a labeled, size/color-graduated circle (bigger and redder =
          higher attention_score); the soft glow underneath is a secondary density cue. Click a
          marker (or a row in the results table) to select and fly to that place. Inferred from
          public social-media posts (synthetic/test data) — never treat as confirmed visitor
          counts.
        </p>
      </div>

      <div className="layer-row">
        <div className="layer-row-head">
          <span className="badge badge-observational">Social attention</span>
        </div>
        <h3>Individual posts (point view)</h3>
        <VisibilityAndOpacity
          layerId={SOCIAL_POINTS_LAYER_ID}
          state={layers[SOCIAL_POINTS_LAYER_ID] ?? defaultLayerState()}
          dispatch={dispatch}
        />
        <ul className="legend-list" aria-label="Social content point legend">
          <li className="legend-item">
            <span className="legend-swatch" style={{ background: SOCIAL_POINT_COLOR }} aria-hidden="true" />
            Social post (placed at highest-confidence matched place)
          </li>
        </ul>
        <p className="layer-meta">
          Optional detail view. Posts without a location match are not plotted.
        </p>
      </div>

      <h2>Uploaded overlays</h2>
      {overlays.length === 0 && (
        <p className="status-message">No overlays uploaded yet. Use the upload panel below.</p>
      )}
      {overlays.map((overlay) => {
        const state = layers[overlay.id] ?? defaultLayerState()
        const color = OVERLAY_GEOMETRY_COLORS[overlay.geometry_type]
        return (
          <div className="layer-row" key={overlay.id}>
            <div className="layer-row-head">
              <span className="badge badge-overlay">Visitor-flow overlay</span>
            </div>
            <h3>{overlay.name}</h3>
            <VisibilityAndOpacity
              layerId={overlay.id}
              state={state}
              dispatch={dispatch}
              onVisibleChange={(visible) => {
                patchOverlay.mutate({ id: overlay.id, visibility: visible ? 'visible' : 'hidden' })
              }}
            />
            <ul className="legend-list" aria-label={`${overlay.name} legend`}>
              <li className="legend-item">
                <span className="legend-swatch" style={{ background: color }} aria-hidden="true" />
                {OVERLAY_GEOMETRY_LABELS[overlay.geometry_type]} — {overlay.measurement_type}
                {overlay.unit ? ` (${overlay.unit})` : ''}
              </li>
            </ul>
            <p className="layer-meta">
              Source: {overlay.source.name}
              {overlay.source.provider ? ` via ${overlay.source.provider}` : ''} · Last updated:{' '}
              {overlay.source.last_updated_at
                ? formatDateTime(overlay.source.last_updated_at)
                : 'unknown'}{' '}
              · {overlay.feature_count} features
            </p>
            {patchOverlay.isError && (
              <p className="error-message" role="alert">
                Could not save visibility change to the server; the map view still updated locally.
              </p>
            )}
          </div>
        )
      })}
    </section>
  )
}

interface VisibilityAndOpacityProps {
  layerId: string
  state: { visible: boolean; opacity: number }
  dispatch: ReturnType<typeof useLayers>['dispatch']
  onVisibleChange?: (visible: boolean) => void
}

function VisibilityAndOpacity({
  layerId,
  state,
  dispatch,
  onVisibleChange,
}: VisibilityAndOpacityProps): React.JSX.Element {
  const visibilityId = `layer-visible-${layerId}`
  const opacityId = `layer-opacity-${layerId}`
  return (
    <>
      <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.4rem' }}>
        <input
          id={visibilityId}
          type="checkbox"
          checked={state.visible}
          onChange={(event) => {
            dispatch({ type: 'SET_VISIBLE', layerId, visible: event.target.checked })
            onVisibleChange?.(event.target.checked)
          }}
        />
        <label htmlFor={visibilityId} style={{ margin: 0 }}>
          {state.visible ? 'Visible' : 'Hidden'}
        </label>
      </div>
      <div className="field">
        <label htmlFor={opacityId}>Opacity ({Math.round(state.opacity * 100)}%)</label>
        <input
          id={opacityId}
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={state.opacity}
          onChange={(event) => {
            dispatch({ type: 'SET_OPACITY', layerId, opacity: Number(event.target.value) })
          }}
        />
      </div>
    </>
  )
}
