import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PipelineStepper } from './PipelineStepper'

describe('PipelineStepper', () => {
  it('shows compact labels and reveals the selected step detail', async () => {
    const user = userEvent.setup()
    render(<PipelineStepper />)

    expect(screen.getByRole('status')).toHaveTextContent('Social signal')
    expect(screen.getByRole('status')).toHaveTextContent('Fixture/API social-content import')

    await user.click(screen.getByRole('button', { name: /visitor data/i }))

    expect(screen.getByRole('status')).toHaveTextContent('Visitor data')
    expect(screen.getByRole('status')).toHaveTextContent('Customer CSV/GeoJSON uploads')
  })

  it('keeps the merge step as part of the selectable editorial flow', async () => {
    const user = userEvent.setup()
    render(<PipelineStepper />)

    await user.click(screen.getByRole('button', { name: /shared map/i }))

    expect(screen.getByRole('status')).toHaveTextContent('Stage 06')
    expect(screen.getByRole('status')).toHaveTextContent('MapLibre view')
  })
})
