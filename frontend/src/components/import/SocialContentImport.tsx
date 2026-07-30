import { useId, useState } from 'react'
import { useImportSocialContent } from '../../api/useImportSocialContent'
import { parseSocialContentFixture } from '../../lib/parseFixture'
import { readFileAsText } from '../../lib/readFileAsText'
import { ImportReport } from './ImportReport'

/**
 * Lets a developer/tester import a JSON fixture of social-content items
 * (there is no file-based endpoint for this resource — the contract takes
 * a JSON body — so the file is read and parsed client-side before POSTing).
 */
export function SocialContentImport(): React.JSX.Element {
  const [sourceName, setSourceName] = useState('')
  const [provider, setProvider] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const mutation = useImportSocialContent()
  const fieldId = useId()

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setParseError(null)
    if (!file || !sourceName.trim()) return

    const text = await readFileAsText(file)
    const result = parseSocialContentFixture(text)
    switch (result.status) {
      case 'invalid-json':
        setParseError(`Could not read the file as JSON: ${result.message}`)
        return
      case 'invalid-shape':
        setParseError(result.message)
        return
      case 'ok':
        mutation.mutate({
          source_name: sourceName.trim(),
          provider: provider.trim() || undefined,
          items: result.items,
        })
    }
  }

  return (
    <section className="panel" aria-labelledby={`${fieldId}-heading`}>
      <h2 id={`${fieldId}-heading`}>Import social-content fixture</h2>
      <form
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
      >
        <div className="field">
          <label htmlFor={`${fieldId}-source-name`}>Source name</label>
          <input
            id={`${fieldId}-source-name`}
            type="text"
            required
            value={sourceName}
            onChange={(event) => {
              setSourceName(event.target.value)
            }}
            placeholder="e.g. synthetic-instagram-batch-1"
          />
        </div>
        <div className="field">
          <label htmlFor={`${fieldId}-provider`}>Provider (optional)</label>
          <input
            id={`${fieldId}-provider`}
            type="text"
            value={provider}
            onChange={(event) => {
              setProvider(event.target.value)
            }}
          />
        </div>
        <div className="field">
          <label htmlFor={`${fieldId}-file`}>JSON fixture file</label>
          <input
            id={`${fieldId}-file`}
            type="file"
            accept="application/json,.json"
            aria-required="true"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
            }}
          />
        </div>
        <button type="submit" className="btn btn-block" disabled={mutation.isPending}>
          {mutation.isPending ? 'Importing…' : 'Import social content'}
        </button>
      </form>

      {parseError && (
        <p className="error-message" role="alert">
          {parseError}
        </p>
      )}
      {mutation.isError && (
        <p className="error-message" role="alert">
          Import failed: {mutation.error.message}
        </p>
      )}
      {mutation.isSuccess && <ImportReport report={mutation.data} />}
    </section>
  )
}
