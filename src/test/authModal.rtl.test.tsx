import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthModal } from '@/features/auth/AuthModal';

describe('AuthModal RTL', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<AuthModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with Accedi tab active by default', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="signin" />);

    expect(screen.getByRole('heading', { level: 2, name: /accedi/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nome@esempio\.it/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/almeno 6 caratteri/i)).toBeInTheDocument();
  });

  it('switches to Crea account tab and shows name field', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="signin" />);

    const signupTab = screen.getByRole('button', { name: /crea account/i });
    fireEvent.click(signupTab);

    expect(screen.getByRole('heading', { level: 2, name: /crea account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/il tuo nome/i)).toBeInTheDocument();
  });

  it('shows error if password is less than 6 characters', async () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="signin" />);

    const emailInput = screen.getByPlaceholderText(/nome@esempio\.it/i);
    const passwordInput = screen.getByPlaceholderText(/almeno 6 caratteri/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });

    const submitBtn = screen.getByRole('button', { name: /accedi all'account/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/almeno 6 caratteri/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<AuthModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /chiudi/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
