import { useId, useState } from 'react'
import { useImportOverlayCsv, useImportOverlayGeojson } from '../../api/useOverlayMutations'
import { ImportReport } from './ImportReport'

type UploadKind = 'csv' | 'geojson'

export function OverlayUpload(): React.JSX.Element {
  const [kind, setKind] = useState<UploadKind>('csv')
  const [name, setName] = useState('')
  const [measurementType, setMeasurementType] = useState('')
  const [unit, setUnit] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fieldId = useId()

  const importCsv = useImportOverlayCsv()
  const importGeojson = useImportOverlayGeojson()
  const activeMutation = kind === 'csv' ? importCsv : importGeojson

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!file || !name.trim() || !measurementType.trim()) return
    activeMutation.mutate({
      file,
      name: name.trim(),
      measurementType: measurementType.trim(),
      unit: unit.trim() || undefined,
    })
  }

  return (
    <section className="panel" aria-labelledby={`${fieldId}-heading`}>
      <h2 id={`${fieldId}-heading`}>Upload visitor-flow overlay</h2>
      <form onSubmit={handleSubmit}>
        <fieldset style={{ border: 'none', padding: 0, margin: '0 0 0.75rem' }}>
          <legend style={{ fontSize: '0.8rem', fontWeight: 600, padding: 0 }}>File format</legend>
          <label style={{ marginRight: '1rem', fontWeight: 400 }}>
            <input
              type="radio"
              name={`${fieldId}-kind`}
              value="csv"
              checked={kind === 'csv'}
              onChange={() => {
                setKind('csv')
              }}
            />{' '}
            CSV
          </label>
          <label style={{ fontWeight: 400 }}>
            <input
              type="radio"
              name={`${fieldId}-kind`}
              value="geojson"
              checked={kind === 'geojson'}
              onChange={() => {
                setKind('geojson')
              }}
            />{' '}
            GeoJSON
          </label>
        </fieldset>

        <div className="field">
          <label htmlFor={`${fieldId}-name`}>Layer name</label>
          <input
            id={`${fieldId}-name`}
            type="text"
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value)
            }}
            placeholder="e.g. Eibsee parking counters (synthetic)"
          />
        </div>
        <div className="field">
          <label htmlFor={`${fieldId}-measurement-type`}>Measurement type</label>
          <input
            id={`${fieldId}-measurement-type`}
            type="text"
            required
            value={measurementType}
            onChange={(event) => {
              setMeasurementType(event.target.value)
            }}
            placeholder="e.g. pedestrian_count"
          />
        </div>
        <div className="field">
          <label htmlFor={`${fieldId}-unit`}>Unit (optional)</label>
          <input
            id={`${fieldId}-unit`}
            type="text"
            value={unit}
            onChange={(event) => {
              setUnit(event.target.value)
            }}
            placeholder="e.g. people/hour"
          />
        </div>
        <div className="field">
          <label htmlFor={`${fieldId}-file`}>{kind === 'csv' ? 'CSV file' : 'GeoJSON file'}</label>
          <input
            id={`${fieldId}-file`}
            type="file"
            accept={kind === 'csv' ? '.csv,text/csv' : '.geojson,.json,application/geo+json,application/json'}
            aria-required="true"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
            }}
          />
        </div>
        <button type="submit" className="btn btn-block" disabled={activeMutation.isPending}>
          {activeMutation.isPending ? 'Uploading…' : 'Upload overlay'}
        </button>
      </form>

      {activeMutation.isError && (
        <p className="error-message" role="alert">
          Upload failed: {activeMutation.error.message}
        </p>
      )}
      {activeMutation.isSuccess && <ImportReport report={activeMutation.data} />}
    </section>
  )
}
