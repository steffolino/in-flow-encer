/** Date helpers used to seed and format filter state. Kept out of components. */

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${String(year)}-${month}-${day}`
}

export interface MonthOption {
  /** e.g. "May 2026" */
  label: string
  from: string
  to: string
}

/**
 * The pilot-region demo window the time slider steps through, month by
 * month. Anchored to when the seeded sample data actually has social-content
 * posts (backend/seed/generate_fixture.py's PERIOD_1: May 2026, PERIOD_2:
 * mid-June-mid-July 2026), with a month of context on either side, rather
 * than the current calendar date — a "trailing 30 days from today" default
 * would show an empty map for this fixed-date synthetic dataset.
 */
export function pilotWindowMonths(): MonthOption[] {
  const months: MonthOption[] = []
  for (let month = 3; month <= 7; month += 1) {
    // month is 0-indexed: 3 = April, 7 = August.
    const start = new Date(2026, month, 1)
    const end = new Date(2026, month + 1, 0)
    months.push({
      label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      from: toIsoDate(start),
      to: toIsoDate(end),
    })
  }
  return months
}
