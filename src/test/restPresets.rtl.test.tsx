/* ============================================
   RTL SUITE 4 — RestPresets
   Radio semantics (mutually exclusive presets),
   arrow-key navigation, selection callback.
   ============================================ */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RestPresets } from '@/features/timer/TimerComponents'

const PRESET_LABELS = ['1:00', '1:30', '2:00', '2:30']

describe('RestPresets', () => {
  it('renders a labelled radiogroup with one radio per preset', () => {
    render(<RestPresets onSelect={vi.fn()} />)

    const group = screen.getByRole('radiogroup')
    expect(group).toHaveAccessibleName('RECUPERO')
    expect(screen.getAllByRole('radio')).toHaveLength(PRESET_LABELS.length)
    for (const label of PRESET_LABELS) {
      expect(screen.getByRole('radio', { name: label })).toBeInTheDocument()
    }
  })

  it('marks only the active preset as checked', () => {
    render(<RestPresets onSelect={vi.fn()} activeSeconds={120} />)

    const radios = screen.getAllByRole('radio')
    const checked = radios.filter((r) => r.getAttribute('aria-checked') === 'true')

    expect(checked).toHaveLength(1)
    expect(checked[0]).toHaveTextContent('2:00')
  })

  it('has no checked radio when nothing is active', () => {
    render(<RestPresets onSelect={vi.fn()} />)

    const radios = screen.getAllByRole('radio')
    expect(radios.every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true)
  })

  it('calls onSelect with the preset duration on click', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<RestPresets onSelect={onSelect} />)

    await user.click(screen.getByRole('radio', { name: '1:30' }))
    expect(onSelect).toHaveBeenCalledWith(90)
  })

  it('moves selection with ArrowRight / ArrowLeft', () => {
    const onSelect = vi.fn()
    render(<RestPresets onSelect={onSelect} activeSeconds={90} />)

    const group = screen.getByRole('radiogroup')

    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith(120)

    fireEvent.keyDown(group, { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith(60)
  })

  it('wraps around at the ends', () => {
    const onSelect = vi.fn()
    // 60s is the first preset → ArrowLeft should wrap to the last (150)
    render(<RestPresets onSelect={onSelect} activeSeconds={60} />)

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith(150)
  })

  it('uses a roving tabindex so only one preset is in the tab order', () => {
    render(<RestPresets onSelect={vi.fn()} activeSeconds={120} />)

    const radios = screen.getAllByRole('radio')
    const focusable = radios.filter((r) => r.getAttribute('tabindex') === '0')

    expect(focusable).toHaveLength(1)
    expect(focusable[0]).toHaveTextContent('2:00')
  })

  it('falls back to the preferred preset for the tab order when none is active', () => {
    render(<RestPresets onSelect={vi.fn()} preferredSeconds={150} />)

    const focusable = screen
      .getAllByRole('radio')
      .filter((r) => r.getAttribute('tabindex') === '0')

    expect(focusable).toHaveLength(1)
    expect(focusable[0]).toHaveTextContent('2:30')
  })
})
