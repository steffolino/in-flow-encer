import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultsTable } from './ResultsTable'
import type { AttentionCell } from '../../api/schemas'

const cell: AttentionCell = {
  place_id: 'p1',
  place_name: 'Eibsee',
  lon: 11.1,
  lat: 47.5,
  post_count: 12,
  total_reach: 5000,
  total_engagement: 300,
  unique_creators: 8,
  change_vs_previous_period: 0.25,
  avg_confidence: 0.8,
  attention_score: 0.72,
}

describe('ResultsTable', () => {
  it('shows a loading status message while loading', () => {
    render(<ResultsTable cells={[]} isLoading isError={false} />)
    expect(screen.getByText(/loading attention data/i)).toBeInTheDocument()
  })

  it('shows an accessible error message on failure', () => {
    render(<ResultsTable cells={[]} isLoading={false} isError />)
    expect(screen.getByRole('alert')).toHaveTextContent(/could not load attention data/i)
  })

  it('shows an empty state when there are no matching places', () => {
    render(<ResultsTable cells={[]} isLoading={false} isError={false} />)
    expect(screen.getByText(/no places match the current filters/i)).toBeInTheDocument()
  })

  it('renders every visible place as an accessible table row', () => {
    render(<ResultsTable cells={[cell]} isLoading={false} isError={false} />)
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Eibsee' })).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('0.72')).toBeInTheDocument()
  })
})
