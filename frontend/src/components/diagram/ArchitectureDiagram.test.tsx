import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ArchitectureDiagram } from './ArchitectureDiagram'

describe('ArchitectureDiagram', () => {
  it('uses click-to-select chips with a shared detail panel', async () => {
    const user = userEvent.setup()
    render(<ArchitectureDiagram />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /analytics/i }))

    expect(screen.getByRole('status')).toHaveTextContent('Analytics')
    expect(screen.getByRole('status')).toHaveTextContent('Attention aggregation')
  })

  it('toggles the in-diagram detail drawer closed', async () => {
    const user = userEvent.setup()
    render(<ArchitectureDiagram />)

    const apiChip = screen.getByRole('button', { name: /api/i })
    await user.click(apiChip)

    expect(screen.getByRole('complementary', { name: /selected architecture detail/i })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Route handlers')

    await user.click(apiChip)

    expect(screen.queryByRole('complementary', { name: /selected architecture detail/i })).not.toBeInTheDocument()
  })

  it('closes the detail drawer from its close button', async () => {
    const user = userEvent.setup()
    render(<ArchitectureDiagram />)

    await user.click(screen.getByRole('button', { name: /api/i }))
    await user.click(screen.getByRole('button', { name: /close architecture detail/i }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('marks the not-yet-built connector as future detail', async () => {
    const user = userEvent.setup()
    render(<ArchitectureDiagram />)

    await user.click(screen.getByRole('button', { name: /connector/i }))

    expect(screen.getByRole('status')).toHaveTextContent('Selected future piece')
    expect(screen.getAllByText('Not built')).toHaveLength(2)
  })
})
