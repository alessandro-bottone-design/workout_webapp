/* ============================================
   GOOGLE CALENDAR — helper puri
   - validazione dell'indirizzo iCal segreto
   - link "Aggiungi a Google Calendar" (nessun login richiesto)
   ============================================ */

/**
 * Normalizza l'indirizzo iCal incollato dall'utente.
 * Ritorna null se non è un indirizzo iCal di Google Calendar.
 * (Stesse regole della funzione server in /api/google-calendar.ts)
 */
export function normalizeGoogleIcalUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value || value.length > 2048) return null;
  if (value.toLowerCase().startsWith('webcal://')) value = `https://${value.slice(9)}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.hostname.toLowerCase() !== 'calendar.google.com') return null;
  if (url.port || url.username || url.password) return null;
  if (!url.pathname.startsWith('/calendar/ical/') || !url.pathname.endsWith('.ics')) return null;
  return url.toString();
}

/** true se l'indirizzo è quello "segreto" (privato) e non quello pubblico. */
export function isPrivateIcalUrl(url: string): boolean {
  return /\/private-[^/]+\/basic\.ics$/.test(url);
}

/** Indirizzo mascherato da mostrare in UI (non esporre il token segreto). */
export function maskIcalUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    // /calendar/ical/<calendarId>/<private-xxxx|public>/basic.ics
    const calendarId = decodeURIComponent(parts[3] ?? '');
    return calendarId || u.hostname;
  } catch {
    return 'Google Calendar';
  }
}

function toGoogleDate(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function toGoogleAllDay(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

export interface GoogleEventDraft {
  title: string;
  start: number;
  end: number;
  allDay?: boolean;
  details?: string;
  location?: string;
}

/**
 * Link che apre Google Calendar (app o web) con l'evento precompilato.
 * Su iPhone, se l'app Google Calendar è installata, il link universale la apre.
 */
export function buildGoogleCalendarEventUrl(draft: GoogleEventDraft): string {
  const dates = draft.allDay
    ? `${toGoogleAllDay(draft.start)}/${toGoogleAllDay(draft.end)}`
    : `${toGoogleDate(draft.start)}/${toGoogleDate(draft.end)}`;
  const params = new URLSearchParams({ action: 'TEMPLATE', text: draft.title, dates });
  if (draft.details) params.set('details', draft.details);
  if (draft.location) params.set('location', draft.location);
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) params.set('ctz', tz);
  } catch {
    /* ignore */
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Apre il link in una nuova scheda / nell'app Google Calendar. */
export function openGoogleCalendarEvent(draft: GoogleEventDraft): void {
  // Un <a target="_blank"> funziona anche nella PWA standalone di iOS
  // (apre Safari / l'app Google Calendar senza chiudere la WebApp).
  const a = document.createElement('a');
  a.href = buildGoogleCalendarEventUrl(draft);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
