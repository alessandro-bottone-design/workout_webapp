/* ============================================
   RTL SUITE 3 — Toggle
   Switch semantics, visible <label> association,
   click-to-toggle from the label.
   ============================================ */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Toggle } from '@/components/ui'

/** Controlled wrapper so re-renders reflect the new checked state. */
function ToggleHarness({ label = 'Suono' }: { label?: string }) {
  const [checked, setChecked] = useState(false)
  return <Toggle checked={checked} onChange={setChecked} label={label} />
}

describe('Toggle', () => {
  it('exposes switch semantics with the checked state', () => {
    render(<Toggle checked onChange={vi.fn()} label="Suono" />)

    const sw = screen.getByRole('switch', { name: 'Suono' })
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })

  it('reports unchecked when off', () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Vibrazione" />)
    expect(screen.getByRole('switch', { name: 'Vibrazione' })).toHaveAttribute(
      'aria-checked',
      'false'
    )
  })

  it('links the visible text to the switch via label/htmlFor', () => {
    render(<ToggleHarness label="Suono" />)

    const sw = screen.getByRole('switch')
    // The label resolves to the same control by its `for`/id pair
    const label = screen.getByText('Suono')
    expect(label).toHaveAttribute('for', sw.getAttribute('id') ?? '')
  })

  it('toggles when the switch itself is clicked', async () => {
    const user = userEvent.setup()
    render(<ToggleHarness label="Suono" />)

    const sw = screen.getByRole('switch')
    expect(sw).toHaveAttribute('aria-checked', 'false')

    await user.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })

  it('toggles when the visible label text is clicked', async () => {
    const user = userEvent.setup()
    render(<ToggleHarness label="Suono" />)

    await user.click(screen.getByText('Suono'))
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('does not change when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} label="Suono" disabled />)

    const sw = screen.getByRole('switch')
    expect(sw).toBeDisabled()

    await user.click(sw)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not render a label element when no label is given', () => {
    const { container } = render(<Toggle checked onChange={vi.fn()} />)
    expect(container.querySelector('label')).toBeNull()
    // Still reachable through the explicit aria-label (undefined here)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })
})
