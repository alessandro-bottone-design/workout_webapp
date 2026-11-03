/* ============================================
   AUTH MODAL — Apple visionOS Design System
   Sign In & Sign Up with Frosted Glass Aesthetics
   ============================================ */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Button, GlassCard } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { syncAll } from '@/lib/sync';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('alessandrobottone2005@gmail.com');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('Alessandro Bottone');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState(false);

  const { signInWithEmail, signUpWithEmail, isConfigured } = useAuthStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Compila tutti i campi obbligatori.');
      return;
    }

    if (password.length < 6) {
      setLocalError('La password deve contenere almeno 6 caratteri.');
      return;
    }

    setIsLoading(true);

    if (mode === 'signin') {
      const res = await signInWithEmail(email, password);
      setIsLoading(false);
      if (res.success) {
        const user = useAuthStore.getState().user;
        if (user) void syncAll(user.id);
        onClose();
      } else {
        setLocalError(res.error || 'Credenziali non valide.');
      }
    } else {
      const res = await signUpWithEmail(email, password, displayName);
      setIsLoading(false);
      if (res.success) {
        if (res.needsEmailConfirmation) {
          setConfirmationNotice(true);
        } else {
          const user = useAuthStore.getState().user;
          if (user) void syncAll(user.id);
          onClose();
        }
      } else {
        setLocalError(res.error || 'Errore durante la creazione dell\'account.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-[400px] z-10"
      >
        <GlassCard className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading font-semibold text-text-primary">
              {mode === 'signin' ? 'Accedi' : 'Crea account'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="w-12 h-12 -mr-2 flex items-center justify-center text-text-secondary hover:text-text-primary rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>

          {!isConfigured && (
            <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-meta">
              <p className="font-semibold mb-1">Configurazione Supabase</p>
              <p className="text-label-sm opacity-90">
                Imposta <code className="bg-black/30 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> e{' '}
                <code className="bg-black/30 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> nel file{' '}
                <code className="bg-black/30 px-1 py-0.5 rounded">.env.local</code> per abilitare la sincronizzazione cloud.
              </p>
            </div>
          )}

          {confirmationNotice ? (
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto text-white">
                <CheckCircle className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="text-heading font-semibold text-text-primary">
                Conferma il tuo indirizzo email
              </h3>
              <p className="text-meta text-text-secondary">
                Abbiamo inviato un link di conferma a <strong className="text-white">{email}</strong>. Clicca sul link nell'email per completare la registrazione.
              </p>
              <Button variant="primary" fullWidth onClick={onClose} className="mt-4">
                Ho capito
              </Button>
            </div>
          ) : (
            <>
              {/* Segmented Control */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setLocalError(null);
                  }}
                  className={`h-10 rounded-lg text-meta font-semibold transition-all ${
                    mode === 'signin'
                      ? 'bg-white text-black'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  Accedi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setLocalError(null);
                  }}
                  className={`h-10 rounded-lg text-meta font-semibold transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-black'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  Crea account
                </button>
              </div>

              {/* Error banner */}
              <AnimatePresence>
                {localError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2 text-red-200 text-meta"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" strokeWidth={1.75} />
                    <span>{localError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-label-sm text-text-secondary mb-2 font-semibold">
                      Nome (opzionale)
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" strokeWidth={1.75} />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Il tuo nome"
                        className="w-full h-12 bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-4 text-body text-text-primary focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-text-secondary/50"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-label-sm text-text-secondary mb-2 font-semibold">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" strokeWidth={1.75} />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@esempio.it"
                      className="w-full h-12 bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-4 text-body text-text-primary focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-text-secondary/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-sm text-text-secondary mb-2 font-semibold">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" strokeWidth={1.75} />
                    <input
                      type="password"
                      required
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Almeno 6 caratteri"
                      className="w-full h-12 bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-4 text-body text-text-primary focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-text-secondary/50"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    {mode === 'signin' ? "Accedi all'account" : 'Registrati'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
};
