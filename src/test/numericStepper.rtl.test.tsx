/* ============================================
   RTL SUITE 2 — NumericStepper
   Spinbutton role, aria values, arrow keys,
   min/max clamping, +/− buttons.
   ============================================ */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { NumericStepper } from '@/components/ui'

/** Controlled wrapper so re-renders reflect the new value. */
function Stepper({
  initial = 10,
  min = 0,
  max = 100,
  step = 1,
  label = 'Peso',
}: {
  initial?: number
  min?: number
  max?: number
  step?: number
  label?: string
}) {
  const [value, setValue] = useState(initial)
  return (
    <NumericStepper
      value={value}
      onChange={setValue}
      min={min}
      max={max}
      step={step}
      label={label}
    />
  )
}

describe('NumericStepper', () => {
  it('exposes spinbutton semantics with current/min/max', () => {
    render(<Stepper initial={10} min={0} max={100} />)

    const spin = screen.getByRole('spinbutton')
    expect(spin).toHaveAttribute('aria-valuenow', '10')
    expect(spin).toHaveAttribute('aria-valuemin', '0')
    expect(spin).toHaveAttribute('aria-valuemax', '100')
    expect(spin).toHaveAccessibleName('Peso')
  })

  it('increments with the + button', async () => {
    const user = userEvent.setup()
    render(<Stepper initial={10} />)

    await user.click(screen.getByRole('button', { name: /Aumenta/ }))
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '11')
  })

  it('decrements with the − button', async () => {
    const user = userEvent.setup()
    render(<Stepper initial={10} />)

    await user.click(screen.getByRole('button', { name: /Riduci/ }))
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '9')
  })

  it('respects the step size', async () => {
    const user = userEvent.setup()
    render(<Stepper initial={10} step={2.5} />)

    await user.click(screen.getByRole('button', { name: /Aumenta/ }))
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '12.5')
  })

  it('adjusts with arrow keys when the spinbutton has focus', () => {
    render(<Stepper initial={10} />)
    const spin = screen.getByRole('spinbutton')
    spin.focus()

    fireEvent.keyDown(spin, { key: 'ArrowUp' })
    expect(spin).toHaveAttribute('aria-valuenow', '11')

    fireEvent.keyDown(spin, { key: 'ArrowRight' })
    expect(spin).toHaveAttribute('aria-valuenow', '12')

    fireEvent.keyDown(spin, { key: 'ArrowDown' })
    expect(spin).toHaveAttribute('aria-valuenow', '11')

    fireEvent.keyDown(spin, { key: 'ArrowLeft' })
    expect(spin).toHaveAttribute('aria-valuenow', '10')
  })

  it('clamps at max and disables the + button', async () => {
    const user = userEvent.setup()
    render(<Stepper initial={10} max={11} />)

    const inc = screen.getByRole('button', { name: /Aumenta/ })
    await user.click(inc)
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '11')
    expect(inc).toBeDisabled()
  })

  it('clamps at min and disables the − button', async () => {
    const user = userEvent.setup()
    render(<Stepper initial={1} min={1} />)

    const dec = screen.getByRole('button', { name: /Riduci/ })
    await user.click(dec)
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '1')
    expect(dec).toBeDisabled()
  })
})
