import type { ImportReport as ImportReportType } from '../../api/schemas'

export function ImportReport({ report }: { report: ImportReportType }): React.JSX.Element {
  return (
    <div className="import-report">
      <dl>
        <div>
          <dt>Received</dt>
          <dd>{report.received}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{report.created}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{report.updated}</dd>
        </div>
        <div>
          <dt>Skipped</dt>
          <dd>{report.skipped}</dd>
        </div>
        <div>
          <dt>Invalid</dt>
          <dd>{report.invalid}</dd>
        </div>
        <div>
          <dt>Duplicates</dt>
          <dd>{report.duplicates}</dd>
        </div>
      </dl>
      {report.warnings.length > 0 && (
        <>
          <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>Row warnings</p>
          <ul className="warning-list">
            {report.warnings.map((warning) => (
              <li key={`${String(warning.row)}-${warning.message}`}>
                Row {warning.row}: {warning.message}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
