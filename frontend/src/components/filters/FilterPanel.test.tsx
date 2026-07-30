import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/testUtils'
import { FilterPanel } from './FilterPanel'

describe('FilterPanel', () => {
  it('exposes every filter control with an accessible label', () => {
    renderWithProviders(<FilterPanel />)
    expect(screen.getByLabelText(/from date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/to date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^platform$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^region$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/source id/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/author category/i)).toBeInTheDocument()
  })

  it('updates platform selection via keyboard-operable native select', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FilterPanel />)
    const platformSelect = screen.getByLabelText(/^platform$/i)
    await user.selectOptions(platformSelect, 'instagram')
    expect(platformSelect).toHaveValue('instagram')
  })

  it('resets filters back to defaults when "Reset filters" is activated', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FilterPanel />)
    const regionSelect = screen.getByLabelText(/^region$/i)
    await user.selectOptions(regionSelect, 'Werdenfelser Land')
    expect(regionSelect).toHaveValue('Werdenfelser Land')

    await user.click(screen.getByRole('button', { name: /reset filters/i }))
    expect(regionSelect).toHaveValue('')
  })
})
