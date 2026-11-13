/* ============================================
   GOOGLE CALENDAR — proxy iCal (Vercel Function)
   GET  /api/google-calendar  -> { "configured": boolean }
   POST /api/google-calendar  { "url": "..." } | { "useDefault": true }

   Google non invia header CORS sui feed .ics, quindi il browser non può
   scaricarli direttamente: questa funzione li scarica lato server e li
   restituisce così come sono. L'URL viaggia nel body (non in query string)
   per non finire nei log, e solo gli indirizzi iCal di calendar.google.com
   sono ammessi (niente proxy aperto / SSRF).
   ============================================ */

const ALLOWED_HOSTS = new Set(['calendar.google.com']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const TIMEOUT_MS = 10_000;

/** Normalizza e valida un indirizzo iCal di Google Calendar. */
export function parseGoogleIcalUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string') return null;
  let value = raw.trim();
  if (value.length === 0 || value.length > 2048) return null;
  if (value.toLowerCase().startsWith('webcal://')) value = `https://${value.slice(9)}`;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;
  if (url.port !== '' || url.username !== '' || url.password !== '') return null;
  if (!url.pathname.startsWith('/calendar/ical/') || !url.pathname.endsWith('.ics')) return null;
  return url;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function jsonError(status: number, error: string): Response {
  return jsonResponse(status, { error });
}

async function fetchIcal(url: URL): Promise<Response> {
  let current = url;
  // Al massimo un redirect, e solo verso un host ammesso.
  for (let hop = 0; hop < 2; hop++) {
    const res = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'text/calendar, text/plain;q=0.9, */*;q=0.1' },
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      const next = location ? parseGoogleIcalUrl(new URL(location, current).toString()) : null;
      if (!next) return res;
      current = next;
      continue;
    }
    return res;
  }
  throw new Error('too many redirects');
}

export async function GET(): Promise<Response> {
  const configured = Boolean(parseGoogleIcalUrl(process.env.GOOGLE_CALENDAR_ICAL_URL));
  return jsonResponse(200, { configured });
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  const rawBody = await request.text();

  if (rawBody.trim().length > 0) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return jsonError(400, 'Richiesta non valida.');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonError(400, 'Richiesta non valida.');
    }
    body = parsed as Record<string, unknown>;
  }

  const hasExplicitUrl = 'url' in body && body.url !== undefined && body.url !== null;
  const shouldUseDefault = body.useDefault === true || !hasExplicitUrl;

  let url: URL | null;
  if (shouldUseDefault) {
    url = parseGoogleIcalUrl(process.env.GOOGLE_CALENDAR_ICAL_URL);
    if (!url) {
      return jsonError(404, 'Calendario predefinito non configurato sul server.');
    }
  } else {
    url = parseGoogleIcalUrl(body.url);
    if (!url) {
      return jsonError(400, "Indirizzo non valido: usa l'indirizzo iCal di Google Calendar (termina con .ics).");
    }
  }

  let upstream: Response;
  try {
    upstream = await fetchIcal(url);
  } catch {
    return jsonError(504, 'Google Calendar non risponde. Riprova tra poco.');
  }

  if (upstream.status === 404 || upstream.status === 403 || upstream.status === 401) {
    return jsonError(404, "Calendario non trovato: controlla l'indirizzo iCal (potrebbe essere stato reimpostato).");
  }
  if (!upstream.ok) {
    return jsonError(502, `Google Calendar ha risposto con errore ${upstream.status}.`);
  }

  const declared = Number(upstream.headers.get('content-length') ?? '0');
  if (declared > MAX_BYTES) return jsonError(413, 'Il calendario è troppo grande.');

  const text = await upstream.text();
  if (text.length > MAX_BYTES) return jsonError(413, 'Il calendario è troppo grande.');
  if (!text.trimStart().startsWith('BEGIN:VCALENDAR')) {
    return jsonError(502, 'La risposta di Google non è un calendario valido.');
  }

  return new Response(text, {
    status: 200,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
