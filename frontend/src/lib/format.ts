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
