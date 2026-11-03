/* ============================================
   AUTH STORE — Zustand state for Supabase Auth
   Apple visionOS Design System compatible
   ============================================ */

import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;

  // Actions
  initAuth: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ success: boolean; needsEmailConfirmation?: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

let isInitialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isConfigured: isSupabaseConfigured(),
  error: null,

  initAuth: async () => {
    if (isInitialized) return;
    isInitialized = true;

    if (!isSupabaseConfigured()) {
      set({ isLoading: false, isConfigured: false });
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Failed to get Supabase session:', error);
        set({ error: error.message, isLoading: false });
      } else {
        set({
          session: data.session,
          user: data.session?.user ?? null,
          isLoading: false,
        });
      }

      // Listen for auth changes (sign in, sign out, token refresh)
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          error: null,
        });
      });
    } catch (err) {
      console.error('Supabase init error:', err);
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ error: null });
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase non è configurato con URL e Chiave.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        set({ error: error.message });
        return { success: false, error: error.message };
      }

      set({
        session: data.session,
        user: data.user,
        error: null,
      });

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore imprevisto durante il login.';
      set({ error: message });
      return { success: false, error: message };
    }
  },

  signUpWithEmail: async (email, password, displayName) => {
    set({ error: null });
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase non è configurato con URL e Chiave.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: displayName?.trim() || undefined,
          },
        },
      });

      if (error) {
        set({ error: error.message });
        return { success: false, error: error.message };
      }

      const needsEmailConfirmation = !data.session && !!data.user;

      set({
        session: data.session,
        user: data.user,
        error: null,
      });

      return { success: true, needsEmailConfirmation };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore imprevisto durante la registrazione.';
      set({ error: message });
      return { success: false, error: message };
    }
  },

  signOut: async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    set({ user: null, session: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
