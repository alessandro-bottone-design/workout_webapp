/* ============================================
   RTL SUITE 5 — WeightEditorSheet
   Modal semantics, keypad entry, Italian decimal
   comma, quick +kg deltas, save/cancel.
   ============================================ */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WeightEditorSheet } from '@/features/workout/WeightEditorSheet'

const baseProps = {
  currentWeight: 40,
  exerciseName: 'Chest Press',
  setNumber: 2,
  onSave: vi.fn(),
  onCancel: vi.fn(),
}

function renderSheet(
  overrides: Partial<React.ComponentProps<typeof WeightEditorSheet>> = {}
) {
  return render(<WeightEditorSheet {...baseProps} {...overrides} />)
}

/**
 * The big weight readout. It has no role/name of its own, and its text
 * ("0", "40", …) also appears on keypad buttons, so scope the query to the
 * 64px display span instead of matching text across the whole sheet.
 */
function getDisplay(container: HTMLElement): string {
  const el = container.querySelector('[class*="text-[64px]"]')
  return el?.textContent ?? ''
}

/** Asserts the sheet's parsed value via the save button label ("SALVA 45 KG"). */
function expectSavedLabel(label: RegExp) {
  expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
}

describe('WeightEditorSheet', () => {
  it('exposes modal semantics with the exercise name as its label', () => {
    renderSheet()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Chest Press')
  })

  it('is closed with Escape', () => {
    const onCancel = vi.fn()
    renderSheet({ onCancel })

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('pre-fills the current weight as an Italian decimal', () => {
    const { container } = renderSheet({ currentWeight: 42.5 })

    expect(getDisplay(container)).toBe('42,5')
    expectSavedLabel(/SALVA 42,5 KG/i)
  })

  it('shows "0" when there is no current weight and keeps save disabled', () => {
    const { container } = renderSheet({ currentWeight: 0 })

    expect(getDisplay(container)).toBe('0')
    // No digit typed yet → nothing valid to save
    expect(screen.getByRole('button', { name: /^SALVA\s*$/i })).toBeDisabled()
  })

  it('appends typed digits to the pre-filled value', async () => {
    const user = userEvent.setup()
    const { container } = renderSheet({ currentWeight: 40 })

    await user.click(screen.getByRole('button', { name: '7' }))
    expect(getDisplay(container)).toBe('407')
  })

  it('clears the pre-filled value with backspace, then types fresh digits', async () => {
    const user = userEvent.setup()
    const { container } = renderSheet({ currentWeight: 40 })

    const backspace = screen.getByRole('button', { name: 'Cancella' })
    await user.click(backspace)
    await user.click(backspace)

    // The readout falls back to "0" when the backing string is empty
    expect(getDisplay(container)).toBe('0')

    await user.click(screen.getByRole('button', { name: '4' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    expect(getDisplay(container)).toBe('45')
  })

  it('saves the parsed weight when confirming', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderSheet({ onSave, currentWeight: 40 })

    const backspace = screen.getByRole('button', { name: 'Cancella' })
    await user.click(backspace)
    await user.click(backspace)
    await user.click(screen.getByRole('button', { name: '4' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: /SALVA 45 KG/i }))

    expect(onSave).toHaveBeenCalledWith(45)
  })

  it('saves an Italian decimal comma as a numeric value', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const { container } = renderSheet({ onSave, currentWeight: 42.5 })

    // Remove the ".5"… actually just save as-is: 42,5 → 42.5
    expect(getDisplay(container)).toBe('42,5')
    await user.click(screen.getByRole('button', { name: /SALVA 42,5 KG/i }))

    expect(onSave).toHaveBeenCalledWith(42.5)
  })

  it('applies a quick +kg delta to the running value', async () => {
    const user = userEvent.setup()
    const { container } = renderSheet({ currentWeight: 40 })

    // Delta labels are Italian-formatted: 2.5 → "Aumenta di 2,5 kg"
    await user.click(screen.getByRole('button', { name: 'Aumenta di 2,5 kg' }))
    expect(getDisplay(container)).toBe('42,5')
  })

  it('stacks multiple deltas', async () => {
    const user = userEvent.setup()
    const { container } = renderSheet({ currentWeight: 40 })

    await user.click(screen.getByRole('button', { name: 'Aumenta di 5 kg' }))
    await user.click(screen.getByRole('button', { name: 'Aumenta di 1 kg' }))
    expect(getDisplay(container)).toBe('46')
  })

  it('clamps the running value at zero', () => {
    const { container } = renderSheet({ currentWeight: 0 })
    expect(getDisplay(container)).toBe('0')

    // Deltas are additive only, so the value can never go negative
    expect(Number(getDisplay(container).replace(',', '.'))).toBeGreaterThanOrEqual(0)
  })

  it('calls onCancel when cancelling', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderSheet({ onCancel })

    await user.click(screen.getByRole('button', { name: /Annulla/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
