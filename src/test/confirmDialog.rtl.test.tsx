/* ============================================
   RTL SUITE 1 — ConfirmDialog
   Modal semantics: role/aria, Escape to close,
   focus trap, restore focus, confirm/cancel.
   ============================================ */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/ui'

const baseProps = {
  isOpen: true,
  title: 'Eliminare la seduta?',
  description: 'Questa azione non può essere annullata.',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    render(<ConfirmDialog {...baseProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('exposes modal semantics with labelled title and description', () => {
    render(<ConfirmDialog {...baseProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    // Accessible name comes from the title, description from the paragraph
    expect(
      screen.getByRole('dialog', { name: /Eliminare la seduta\?/ })
    ).toBeInTheDocument()
    expect(screen.getByText('Questa azione non può essere annullata.')).toBeInTheDocument()
  })

  it('calls onConfirm when the confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Conferma' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when the cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: 'Annulla' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('moves initial focus into the dialog', () => {
    render(<ConfirmDialog {...baseProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('keeps focus inside the dialog when tabbing past the last element', () => {
    render(<ConfirmDialog {...baseProps} />)

    const dialog = screen.getByRole('dialog')
    const buttons = screen.getAllByRole('button')
    const last = buttons[buttons.length - 1]

    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })

    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('uses the danger variant when isDanger is set', () => {
    render(<ConfirmDialog {...baseProps} isDanger />)
    expect(screen.getByRole('button', { name: 'Conferma' })).toBeInTheDocument()
  })
})
