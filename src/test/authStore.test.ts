import { describe, it, expect, beforeEach } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';
import { useAuthStore } from '@/stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
      error: null,
    });
  });

  it('initializes with unconfigured status if env vars are absent', async () => {
    await useAuthStore.getState().initAuth();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('handles sign in validation when credentials are empty', async () => {
    const res = await useAuthStore.getState().signInWithEmail('', '');
    expect(res.success).toBe(false);
  });

  it('handles sign up validation when credentials are empty', async () => {
    const res = await useAuthStore.getState().signUpWithEmail('', '');
    expect(res.success).toBe(false);
  });

  it('signOut clears active user and session', async () => {
    const mockUser = { id: 'test-user', email: 'test@example.com' } as unknown as User;
    const mockSession = { access_token: 'xyz', user: mockUser } as unknown as Session;

    useAuthStore.setState({
      user: mockUser,
      session: mockSession,
    });

    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
  });
});
