import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  normalizeGoogleIcalUrl,
  isPrivateIcalUrl,
  maskIcalUrl,
  buildGoogleCalendarEventUrl,
} from '@features/calendar/googleCalendar';
import { parseGoogleIcalUrl, GET, POST } from '../../../../api/google-calendar';
import { useGoogleCalendarStore } from '@features/calendar/googleCalendarStore';
import { settingsRepo } from '@shared/db/repositories';
import { db } from '@shared/db/database';

function makeSampleIcs(calName = 'Personale', title = 'Allenamento Gambe') {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ymd = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;

  return [
    'BEGIN:VCALENDAR',
    `X-WR-CALNAME:${calName}`,
    'BEGIN:VEVENT',
    'UID:test-1',
    `SUMMARY:${title}`,
    `DTSTART:${ymd}T180000`,
    `DTEND:${ymd}T190000`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

describe('googleCalendar helpers', () => {
  it('validates and normalizes Google Calendar iCal URLs only', () => {
    const valid = 'https://calendar.google.com/calendar/ical/user%40gmail.com/private-abc123/basic.ics';
    expect(normalizeGoogleIcalUrl(valid)).toBe(valid);
    expect(
      normalizeGoogleIcalUrl(
        'webcal://calendar.google.com/calendar/ical/user%40gmail.com/private-abc123/basic.ics'
      )
    ).toBe(valid);
    expect(parseGoogleIcalUrl(valid)?.toString()).toBe(valid);

    // Reject non-Google / SSRF / non-ics URLs
    expect(normalizeGoogleIcalUrl('https://evil.example.com/calendar/ical/a/basic.ics')).toBeNull();
    expect(normalizeGoogleIcalUrl('http://127.0.0.1:8080/calendar/ical/a/basic.ics')).toBeNull();
    expect(normalizeGoogleIcalUrl('https://calendar.google.com/calendar/r')).toBeNull();
    expect(parseGoogleIcalUrl('https://169.254.169.254/latest/meta-data')).toBeNull();
  });

  it('detects private vs public iCal URLs and masks token', () => {
    const priv = 'https://calendar.google.com/calendar/ical/ale%40gmail.com/private-secret999/basic.ics';
    const pub = 'https://calendar.google.com/calendar/ical/ale%40gmail.com/public/basic.ics';
    expect(isPrivateIcalUrl(priv)).toBe(true);
    expect(isPrivateIcalUrl(pub)).toBe(false);
    expect(maskIcalUrl(priv)).toBe('ale@gmail.com');
    expect(maskIcalUrl(priv)).not.toContain('secret999');
  });

  it('builds valid Google Calendar TEMPLATE event URL', () => {
    const start = new Date(2026, 10, 12, 18, 0).getTime();
    const end = start + 60 * 60_000;
    const url = new URL(
      buildGoogleCalendarEventUrl({
        title: 'Workout · Seduta 1',
        start,
        end,
        details: 'Chest Press 4x8',
      })
    );
    expect(url.origin).toBe('https://calendar.google.com');
    expect(url.pathname).toBe('/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('Workout · Seduta 1');
    expect(url.searchParams.get('details')).toBe('Chest Press 4x8');
    expect(url.searchParams.get('dates')).toMatch(/^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
  });
});

describe('api/google-calendar handler', () => {
  const originalEnv = process.env.GOOGLE_CALENDAR_ICAL_URL;

  beforeEach(() => {
    delete process.env.GOOGLE_CALENDAR_ICAL_URL;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.GOOGLE_CALENDAR_ICAL_URL;
    } else {
      process.env.GOOGLE_CALENDAR_ICAL_URL = originalEnv;
    }
  });

  it('GET returns { configured: false } when env is missing or invalid', async () => {
    const res1 = await GET();
    expect(res1.status).toBe(200);
    expect(res1.headers.get('cache-control')).toBe('no-store');
    expect(await res1.json()).toEqual({ configured: false });

    process.env.GOOGLE_CALENDAR_ICAL_URL = 'https://evil.example.com/calendar.ics';
    const res2 = await GET();
    expect(res2.status).toBe(200);
    expect(await res2.json()).toEqual({ configured: false });
  });

  it('GET returns { configured: true } without exposing the secret URL', async () => {
    const secretUrl = 'https://calendar.google.com/calendar/ical/ale%40gmail.com/private-topsecret/basic.ics';
    process.env.GOOGLE_CALENDAR_ICAL_URL = secretUrl;

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ configured: true });
    expect(text).not.toContain('private-topsecret');
    expect(text).not.toContain('calendar.google.com');
  });

  it('POST with useDefault returns 404 when server default is not configured', async () => {
    const req = new Request('http://localhost/api/google-calendar', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ useDefault: true }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: 'Calendario predefinito non configurato sul server.',
    });
  });

  it('POST with empty body uses server default and returns 404 if unconfigured', async () => {
    const req = new Request('http://localhost/api/google-calendar', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('POST with useDefault fetches server env URL and returns 200 text/calendar', async () => {
    const secretUrl = 'https://calendar.google.com/calendar/ical/ale%40gmail.com/private-envkey/basic.ics';
    process.env.GOOGLE_CALENDAR_ICAL_URL = secretUrl;
    const ics = makeSampleIcs('Server Cal', 'Squat Day');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(ics, {
        status: 200,
        headers: { 'content-type': 'text/calendar' },
      })
    );

    const req = new Request('http://localhost/api/google-calendar', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ useDefault: true }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/calendar');
    expect(await res.text()).toBe(ics);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toBe(secretUrl);
  });

  it('POST rejects SSRF / non-Google URLs with 400 without fetching upstream', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const badUrls = [
      'http://127.0.0.1:8080/calendar/ical/x/basic.ics',
      'https://169.254.169.254/latest/meta-data',
      'https://calendar.google.com@evil.com/calendar/ical/x/basic.ics',
      'https://calendar.google.com/calendar/ical/x/basic.txt',
    ];

    for (const url of badUrls) {
      const req = new Request('http://localhost/api/google-calendar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('useGoogleCalendarStore', () => {
  beforeEach(async () => {
    await db.settings.clear();
    useGoogleCalendarStore.getState().disconnect();
    useGoogleCalendarStore.setState({ serverConfigured: false });
    vi.restoreAllMocks();
  });

  it('rejects invalid URLs without calling fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await useGoogleCalendarStore.getState().connect('https://example.com/cal.ics');
    expect(res.success).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(useGoogleCalendarStore.getState().error).toBeTruthy();
  });

  it('connects, parses events from /api/google-calendar and disconnects cleanly', async () => {
    const sampleIcs = makeSampleIcs('Personale', 'Allenamento Gambe');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(sampleIcs, {
        status: 200,
        headers: { 'content-type': 'text/calendar' },
      })
    );

    const url = 'https://calendar.google.com/calendar/ical/ale%40gmail.com/private-xyz/basic.ics';
    const res = await useGoogleCalendarStore.getState().connect(url);

    expect(res.success).toBe(true);
    const state = useGoogleCalendarStore.getState();
    expect(state.icalUrl).toBe(url);
    expect(state.connectionMode).toBe('user-ical');
    expect(state.isConnected).toBe(true);
    expect(state.calendarName).toBe('Personale');
    expect(state.events).toHaveLength(1);
    expect(state.events[0].title).toBe('Allenamento Gambe');

    const storedSettings = await settingsRepo.get();
    expect(storedSettings.googleIcalUrl).toBe(url);

    state.disconnect();
    expect(useGoogleCalendarStore.getState().icalUrl).toBeNull();
    expect(useGoogleCalendarStore.getState().connectionMode).toBeNull();
    expect(useGoogleCalendarStore.getState().isConnected).toBe(false);
    expect(useGoogleCalendarStore.getState().events).toHaveLength(0);
  });

  it('bootstrap connects automatically via server-default when GET returns { configured: true }', async () => {
    const sampleIcs = makeSampleIcs('Palestra Default', 'Push Day');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (String(input) === '/api/google-calendar' && init?.method === 'GET') {
        return new Response(JSON.stringify({ configured: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (String(input) === '/api/google-calendar' && init?.method === 'POST') {
        expect(JSON.parse(String(init.body))).toEqual({ useDefault: true });
        return new Response(sampleIcs, {
          status: 200,
          headers: { 'content-type': 'text/calendar' },
        });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });

    await useGoogleCalendarStore.getState().bootstrap();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const state = useGoogleCalendarStore.getState();
    expect(state.connectionMode).toBe('server-default');
    expect(state.serverConfigured).toBe(true);
    expect(state.isConnected).toBe(true);
    expect(state.icalUrl).toBeNull();
    expect(state.calendarName).toBe('Palestra Default');
    expect(state.events).toHaveLength(1);
    expect(state.events[0].title).toBe('Push Day');
  });

  it('bootstrap prefers settingsRepo googleIcalUrl over server-default', async () => {
    const userUrl = 'https://calendar.google.com/calendar/ical/user%40gmail.com/private-abc/basic.ics';
    await settingsRepo.update({ googleIcalUrl: userUrl });

    const sampleIcs = makeSampleIcs('Mio Calendario', 'Pull Day');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      expect(init?.method).toBe('POST');
      expect(JSON.parse(String(init?.body))).toEqual({ url: userUrl });
      return new Response(sampleIcs, {
        status: 200,
        headers: { 'content-type': 'text/calendar' },
      });
    });

    await useGoogleCalendarStore.getState().bootstrap();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const state = useGoogleCalendarStore.getState();
    expect(state.connectionMode).toBe('user-ical');
    expect(state.icalUrl).toBe(userUrl);
    expect(state.isConnected).toBe(true);
    expect(state.events).toHaveLength(1);
  });

  it('offline / 5xx errors never reset connectionMode, icalUrl or cached events', async () => {
    const sampleIcs = makeSampleIcs('Cached Cal', 'Leg Day');

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      if (init?.method === 'GET') {
        return new Response(JSON.stringify({ configured: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(sampleIcs, {
        status: 200,
        headers: { 'content-type': 'text/calendar' },
      });
    });

    await useGoogleCalendarStore.getState().bootstrap();
    expect(useGoogleCalendarStore.getState().events).toHaveLength(1);

    // Simulate offline error on bootstrap & 502 on forced refresh
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('NetworkError'));
    await useGoogleCalendarStore.getState().bootstrap();
    expect(useGoogleCalendarStore.getState().connectionMode).toBe('server-default');
    expect(useGoogleCalendarStore.getState().isConnected).toBe(true);
    expect(useGoogleCalendarStore.getState().events).toHaveLength(1);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Upstream 502' }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      })
    );
    await useGoogleCalendarStore.getState().refresh({ force: true });
    expect(useGoogleCalendarStore.getState().connectionMode).toBe('server-default');
    expect(useGoogleCalendarStore.getState().isConnected).toBe(true);
    expect(useGoogleCalendarStore.getState().events).toHaveLength(1);
    expect(useGoogleCalendarStore.getState().error).toBe('Upstream 502');
  });
});
