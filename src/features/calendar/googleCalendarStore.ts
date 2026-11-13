/* ============================================
   GOOGLE CALENDAR STORE — collegamento ibrido (Server Env + Supabase + Local-First)
   - Se esiste un iCal personale (localStorage / settingsRepo / Supabase), usa 'user-ical'.
   - Altrimenti verifica GET /api/google-calendar e, se configurato, usa 'server-default'
     scaricando il feed tramite POST /api/google-calendar { useDefault: true }.
   - Errori offline / 5xx non resettano mai connectionMode, icalUrl o gli eventi in cache.
   ============================================ */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { settingsRepo } from '@shared/db/repositories';
import { parseIcal, type CalendarEvent } from '@features/calendar/ical';
import { normalizeGoogleIcalUrl } from '@features/calendar/googleCalendar';

const API_PATH = '/api/google-calendar';
/** Dopo quanto tempo un aggiornamento automatico è considerato necessario. */
export const GOOGLE_CALENDAR_STALE_MS = 15 * 60 * 1000;

export type GoogleCalendarConnectionMode = 'server-default' | 'user-ical' | null;

interface GoogleCalendarState {
  icalUrl: string | null;
  connectionMode: GoogleCalendarConnectionMode;
  serverConfigured: boolean;
  isConnected: boolean;
  calendarName: string | null;
  events: CalendarEvent[];
  lastSyncedAt: number | null;
  isSyncing: boolean;
  error: string | null;

  bootstrap: () => Promise<void>;
  connect: (rawUrl: string) => Promise<{ success: boolean; error?: string }>;
  restoreUserIcalUrl: (rawUrl: string) => Promise<void>;
  refresh: (opts?: { force?: boolean }) => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

function computeIsConnected(icalUrl: string | null, connectionMode: GoogleCalendarConnectionMode): boolean {
  return Boolean(icalUrl || connectionMode === 'server-default');
}

/** Finestra temporale degli eventi tenuti in memoria: -3 mesi / +12 mesi. */
function currentWindow(now = new Date()) {
  return {
    from: new Date(now.getFullYear(), now.getMonth() - 3, 1).getTime(),
    to: new Date(now.getFullYear(), now.getMonth() + 13, 1).getTime(),
  };
}

async function downloadAndParse(payload: { url: string } | { useDefault: true }) {
  let res: Response;
  try {
    res = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch {
    throw new Error('Sei offline: mostro gli eventi salvati.');
  }

  if (!res.ok) {
    let message = `Errore ${res.status} durante l'aggiornamento del calendario.`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* risposta non JSON */
    }
    throw new Error(message);
  }

  const text = await res.text();
  return parseIcal(text, currentWindow());
}

let inflight: Promise<void> | null = null;
let bootstrapInflight: Promise<void> | null = null;

export const useGoogleCalendarStore = create<GoogleCalendarState>()(
  persist(
    (set, get) => ({
      icalUrl: null,
      connectionMode: null,
      serverConfigured: false,
      isConnected: false,
      calendarName: null,
      events: [],
      lastSyncedAt: null,
      isSyncing: false,
      error: null,

      bootstrap: async () => {
        if (bootstrapInflight) return bootstrapInflight;

        bootstrapInflight = (async () => {
          try {
            // 1. Controlla localStorage (stato store) o settingsRepo (IndexedDB / sync cloud)
            let localUrl = get().icalUrl ? normalizeGoogleIcalUrl(get().icalUrl!) : null;
            if (!localUrl) {
              try {
                const settings = await settingsRepo.get();
                if (settings.googleIcalUrl) {
                  localUrl = normalizeGoogleIcalUrl(settings.googleIcalUrl);
                }
              } catch {
                /* fallback se IndexedDB non disponibile */
              }
            }

            if (localUrl) {
              set({
                icalUrl: localUrl,
                connectionMode: 'user-ical',
                isConnected: true,
              });
              await get().refresh();
              return;
            }

            // 2. Altrimenti interroga GET /api/google-calendar per verificare se esiste un default server-side
            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
              // Offline: preserva connectionMode, icalUrl ed eventi in cache senza loggare errori di rete
              return;
            }
            let res: Response;
            try {
              res = await fetch(API_PATH, { method: 'GET', cache: 'no-store' });
            } catch {
              // Offline: preserva connectionMode, icalUrl ed eventi in cache
              return;
            }

            if (!res.ok) {
              // 5xx / endpoint assente: preserva stato e cache esistenti
              return;
            }

            const contentType = res.headers.get('content-type') ?? '';
            if (!contentType.includes('application/json')) {
              return;
            }

            let data: { configured?: unknown };
            try {
              data = (await res.json()) as { configured?: unknown };
            } catch {
              return;
            }

            if (data.configured === true) {
              set({
                connectionMode: 'server-default',
                serverConfigured: true,
                isConnected: true,
              });
              await get().refresh();
            } else {
              set({ serverConfigured: false });
              if (!get().icalUrl && get().connectionMode === 'server-default') {
                set({
                  connectionMode: null,
                  isConnected: false,
                });
              }
            }
          } finally {
            bootstrapInflight = null;
          }
        })();

        return bootstrapInflight;
      },

      connect: async (rawUrl) => {
        const icalUrl = normalizeGoogleIcalUrl(rawUrl);
        if (!icalUrl) {
          const error =
            'Indirizzo non valido. Incolla l\'"Indirizzo segreto in formato iCal" (inizia con https://calendar.google.com/calendar/ical/ e termina con .ics).';
          set({ error });
          return { success: false, error };
        }
        set({ isSyncing: true, error: null });
        try {
          const parsed = await downloadAndParse({ url: icalUrl });
          set({
            icalUrl,
            connectionMode: 'user-ical',
            isConnected: true,
            calendarName: parsed.name ?? null,
            events: parsed.events,
            lastSyncedAt: Date.now(),
            isSyncing: false,
            error: null,
          });
          try {
            await settingsRepo.update({ googleIcalUrl: icalUrl });
          } catch {
            /* ignore IndexedDB write failure */
          }
          return { success: true };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Impossibile collegare il calendario.';
          set({ isSyncing: false, error });
          return { success: false, error };
        }
      },

      restoreUserIcalUrl: async (rawUrl) => {
        const normalized = normalizeGoogleIcalUrl(rawUrl);
        if (!normalized) return;
        set({
          icalUrl: normalized,
          connectionMode: 'user-ical',
          isConnected: true,
        });
        await get().refresh({ force: true });
      },

      refresh: async ({ force = false } = {}) => {
        const { icalUrl, connectionMode, lastSyncedAt, events } = get();
        const effectiveMode: GoogleCalendarConnectionMode = icalUrl
          ? 'user-ical'
          : connectionMode === 'server-default'
            ? 'server-default'
            : null;
        if (!effectiveMode) return;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          if (force) {
            set({ error: 'Sei offline: mostro gli eventi salvati.' });
          }
          return;
        }

        const hasCachedEvents = events.length > 0;
        if (
          !force &&
          lastSyncedAt &&
          hasCachedEvents &&
          Date.now() - lastSyncedAt < GOOGLE_CALENDAR_STALE_MS
        ) {
          return;
        }
        if (inflight) return inflight;

        const targetUrl = icalUrl;
        inflight = (async () => {
          set({ isSyncing: true, error: null });
          try {
            const payload =
              effectiveMode === 'user-ical' && targetUrl
                ? { url: targetUrl }
                : { useDefault: true as const };
            const parsed = await downloadAndParse(payload);

            // L'utente potrebbe aver scollegato o cambiato modalità nel frattempo
            const current = get();
            if (current.icalUrl !== targetUrl || current.connectionMode !== effectiveMode) {
              set({ isSyncing: false });
              return;
            }
            set({
              connectionMode: effectiveMode,
              isConnected: computeIsConnected(targetUrl, effectiveMode),
              calendarName: parsed.name ?? current.calendarName,
              events: parsed.events,
              lastSyncedAt: Date.now(),
              isSyncing: false,
            });
          } catch (err) {
            // Errori offline / 5xx non resettano mai connectionMode, icalUrl o gli eventi salvati
            set({
              isSyncing: false,
              error: err instanceof Error ? err.message : 'Aggiornamento non riuscito.',
            });
          } finally {
            inflight = null;
          }
        })();
        return inflight;
      },

      disconnect: () => {
        set({
          icalUrl: null,
          connectionMode: null,
          isConnected: false,
          calendarName: null,
          events: [],
          lastSyncedAt: null,
          isSyncing: false,
          error: null,
        });
        void settingsRepo.update({ googleIcalUrl: null }).catch(() => {});
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'workout.googleCalendar.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        icalUrl: s.icalUrl,
        connectionMode: s.connectionMode,
        serverConfigured: s.serverConfigured,
        calendarName: s.calendarName,
        events: s.events,
        lastSyncedAt: s.lastSyncedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const mode: GoogleCalendarConnectionMode = state.icalUrl
          ? 'user-ical'
          : state.connectionMode === 'server-default'
            ? 'server-default'
            : null;
        state.connectionMode = mode;
        state.isConnected = computeIsConnected(state.icalUrl, mode);
      },
    }
  )
);
