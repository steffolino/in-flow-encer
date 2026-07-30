/** Date helpers used to seed and format filter state. Kept out of components. */

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${String(year)}-${month}-${day}`
}

/** Default filter window: the trailing 30 days up to and including today. */
export function defaultDateRange(today: Date = new Date()): { from: string; to: string } {
  const to = toIsoDate(today)
  const fromDate = new Date(today)
  fromDate.setDate(fromDate.getDate() - 30)
  const from = toIsoDate(fromDate)
  return { from, to }
}
