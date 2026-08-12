/** Presentation-only number/date formatting helpers, kept out of components. */

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const integerFormatter = new Intl.NumberFormat('en-US')

export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value)
}

export function formatInteger(value: number): string {
  return integerFormatter.format(Math.round(value))
}

export function formatPercentChange(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'no prior data'
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(0)}%`
}

/**
 * Formats a value that is already a percentage (e.g. the backend's
 * ForecastCell.trend_pct, which is `((current - previous) / previous) *
 * 100`) — unlike formatPercentChange, which expects a 0..1 fraction.
 */
export function formatSignedPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'no prior period to compare'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function formatConfidence(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'unknown confidence'
  return `${(value * 100).toFixed(0)}% confidence`
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
