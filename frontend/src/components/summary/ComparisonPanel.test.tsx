import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComparisonPanel } from './ComparisonPanel'
import type { ComparisonItem } from '../../api/schemas'

const item: ComparisonItem = {
  place_id: 'p1',
  place_name: 'Königssee',
  attention_level: 'high',
  visitor_flow_level: 'low',
  statement: 'High social attention but low observed visitor-flow values.',
}

describe('ComparisonPanel', () => {
  it('shows a loading state', () => {
    render(<ComparisonPanel items={[]} isLoading isError={false} />)
    expect(screen.getByText(/loading comparison/i)).toBeInTheDocument()
  })

  it('shows an accessible error state', () => {
    render(<ComparisonPanel items={[]} isLoading={false} isError />)
    expect(screen.getByRole('alert')).toHaveTextContent(/could not load/i)
  })

  it('shows an empty state', () => {
    render(<ComparisonPanel items={[]} isLoading={false} isError={false} />)
    expect(screen.getByText(/no comparison data/i)).toBeInTheDocument()
  })

  it('renders the server-provided statement verbatim, without re-deriving it', () => {
    render(<ComparisonPanel items={[item]} isLoading={false} isError={false} />)
    expect(screen.getByText(item.statement)).toBeInTheDocument()
    expect(screen.getByText(/attention: high/i)).toBeInTheDocument()
    expect(screen.getByText(/visitor flow: low/i)).toBeInTheDocument()
  })
})
