import { useState } from 'react'
import { DetailPanel } from './DetailPanel'
import { MERGE_STEP, PRIMARY_STEPS, SECONDARY_STEPS, type PipelineStepData } from './pipelineSteps.data'

const DEFAULT_SELECTED = PRIMARY_STEPS[0]?.id ?? 'social-input'
const ALL_STEPS = [...PRIMARY_STEPS, ...SECONDARY_STEPS, MERGE_STEP]

interface StepButtonProps {
  step: PipelineStepData
  selected: boolean
  emphasized?: boolean
  onSelect: (id: string) => void
}

function StepButton({ step, selected, emphasized, onSelect }: StepButtonProps): React.JSX.Element {
  const Icon = step.icon
  const classes = [
    'step-btn',
    `step-btn--${step.accent}`,
    selected && 'step-btn--selected',
    emphasized && 'step-btn--emphasized',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={selected}
      onClick={() => {
        onSelect(step.id)
      }}
    >
      <span className="step-btn-label">{step.sequence}</span>
      <span className="step-btn-icon" aria-hidden="true">
        <Icon size={14} strokeWidth={2} />
      </span>
      <span className="step-btn-title">{step.label}</span>
    </button>
  )
}

export function PipelineStepper(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED)
  const selected = ALL_STEPS.find((step) => step.id === selectedId) ?? PRIMARY_STEPS[0]

  return (
    <div className="stepper" role="group" aria-label="Inflowencer data pipeline, select a stage for detail">
      <div className="stepper-body">
        <div className="stepper-track stepper-track--secondary">
          <span className="stepper-track-label">Visitor-flow overlays</span>
          <div className="stepper-row">
            {SECONDARY_STEPS.map((step) => (
              <StepButton key={step.id} step={step} selected={step.id === selectedId} onSelect={setSelectedId} />
            ))}
          </div>
          <p className="stepper-merge-note">Joins the shared map at step {MERGE_STEP.sequence}</p>
        </div>

        <div className="stepper-track stepper-track--primary">
          <span className="stepper-track-label">Social attention</span>
          <div className="stepper-row">
            {PRIMARY_STEPS.map((step) => (
              <StepButton key={step.id} step={step} selected={step.id === selectedId} onSelect={setSelectedId} />
            ))}
            <span className="step-arrow" aria-hidden="true" />
            <StepButton step={MERGE_STEP} selected={MERGE_STEP.id === selectedId} onSelect={setSelectedId} emphasized />
          </div>
        </div>
      </div>

      {selected && (
        <DetailPanel
          eyebrow={`Stage ${selected.sequence}`}
          label={selected.label}
          detail={selected.detail}
          icon={selected.icon}
          accent={selected.accent}
          badgeLabel={selected.badgeLabel}
        />
      )}
    </div>
  )
}
