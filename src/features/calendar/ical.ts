/* ============================================
   iCAL PARSER — feed .ics di Google Calendar
   Supporta: eventi singoli e all-day, TZID, RRULE (DAILY/WEEKLY/
   MONTHLY/YEARLY con INTERVAL, COUNT, UNTIL, BYDAY, BYMONTHDAY,
   BYMONTH), EXDATE, RECURRENCE-ID (occorrenze modificate),
   STATUS:CANCELLED.
   Nessuna dipendenza: gira nel browser e nei test.
   ============================================ */

export interface CalendarEvent {
  /** Chiave unica per occorrenza (uid + inizio). */
  id: string;
  uid: string;
  title: string;
  location?: string;
  /** Epoch ms. Per gli all-day è la mezzanotte locale del giorno. */
  start: number;
  /** Epoch ms, esclusivo. */
  end: number;
  allDay: boolean;
}

export interface ParsedCalendar {
  name?: string;
  events: CalendarEvent[];
}

export interface ExpandWindow {
  from: number;
  to: number;
}

/* ---------- low level ---------- */

interface Prop {
  name: string;
  params: Record<string, string>;
  value: string;
}

function unfold(text: string): string[] {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '').split('\n');
}

function parseLine(line: string): Prop | null {
  let inQuotes = false;
  let colon = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ':' && !inQuotes) {
      colon = i;
      break;
    }
  }
  if (colon <= 0) return null;
  const head = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const [rawName, ...rawParams] = head.split(';');
  const params: Record<string, string> = {};
  for (const p of rawParams) {
    const eq = p.indexOf('=');
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: rawName.toUpperCase(), params, value };
}

function unescapeText(v: string): string {
  return v.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1').trim();
}

/* ---------- time zones ---------- */

const dtfCache = new Map<string, Intl.DateTimeFormat | null>();

function getDtf(tz: string): Intl.DateTimeFormat | null {
  if (dtfCache.has(tz)) return dtfCache.get(tz) ?? null;
  let dtf: Intl.DateTimeFormat | null = null;
  try {
    dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    dtf = null;
  }
  dtfCache.set(tz, dtf);
  return dtf;
}

/** Offset (ms) del fuso `tz` rispetto a UTC all'istante `epoch`. */
function tzOffset(epoch: number, dtf: Intl.DateTimeFormat): number {
  const parts: Record<string, number> = {};
  for (const p of dtf.formatToParts(new Date(epoch))) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour % 24, parts.minute, parts.second);
  return asUtc - Math.floor(epoch / 1000) * 1000;
}

/** Converte un orario "da orologio" in un fuso in epoch ms. */
function wallTimeToEpoch(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  s: number,
  tz?: string
): number {
  const dtf = tz ? getDtf(tz) : null;
  if (!dtf) return new Date(y, mo - 1, d, h, mi, s).getTime(); // floating / fuso sconosciuto → ora locale
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  const off1 = tzOffset(guess, dtf);
  let t = guess - off1;
  const off2 = tzOffset(t, dtf);
  if (off2 !== off1) t = guess - off2;
  return t;
}

/* ---------- date values ---------- */

interface DateValue {
  /** Data civile (anno, mese 1-12, giorno) e ora "da orologio". */
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  s: number;
  allDay: boolean;
  utc: boolean;
  tz?: string;
}

function parseDateValue(raw: string, params: Record<string, string>): DateValue | null {
  const v = raw.trim();
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(v);
  if (!m) return null;
  const allDay = params.VALUE === 'DATE' || m[4] === undefined;
  return {
    y: Number(m[1]),
    mo: Number(m[2]),
    d: Number(m[3]),
    h: allDay ? 0 : Number(m[4]),
    mi: allDay ? 0 : Number(m[5]),
    s: allDay ? 0 : Number(m[6] ?? '0'),
    allDay,
    utc: m[7] === 'Z',
    tz: params.TZID,
  };
}

function toEpoch(dv: DateValue): number {
  if (dv.allDay) return new Date(dv.y, dv.mo - 1, dv.d).getTime();
  if (dv.utc) return Date.UTC(dv.y, dv.mo - 1, dv.d, dv.h, dv.mi, dv.s);
  return wallTimeToEpoch(dv.y, dv.mo, dv.d, dv.h, dv.mi, dv.s, dv.tz);
}

/** Stessa ora "da orologio", in un'altra data civile (rispetta l'ora legale del fuso). */
function withDate(dv: DateValue, y: number, mo: number, d: number): DateValue {
  return { ...dv, y, mo, d };
}

function parseDuration(v: string): number | null {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(v.trim());
  if (!m) return null;
  const sign = m[1] === '-' ? -1 : 1;
  const ms =
    (Number(m[2] ?? 0) * 7 * 86400 +
      Number(m[3] ?? 0) * 86400 +
      Number(m[4] ?? 0) * 3600 +
      Number(m[5] ?? 0) * 60 +
      Number(m[6] ?? 0)) *
    1000;
  return sign * ms;
}

/* ---------- civil date helpers (giorni come numeri UTC, senza fusi) ---------- */

const DAY_MS = 86_400_000;
const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function civilDay(y: number, mo: number, d: number): number {
  return Math.floor(Date.UTC(y, mo - 1, d) / DAY_MS);
}

function fromCivilDay(day: number): { y: number; mo: number; d: number; wd: number } {
  const dt = new Date(day * DAY_MS);
  return { y: dt.getUTCFullYear(), mo: dt.getUTCMonth() + 1, d: dt.getUTCDate(), wd: dt.getUTCDay() };
}

function daysInMonth(y: number, mo: number): number {
  return new Date(Date.UTC(y, mo, 0)).getUTCDate();
}

interface ByDay {
  ord: number; // 0 = tutti
  wd: number;
}

function parseByDay(v: string | undefined): ByDay[] {
  if (!v) return [];
  return v
    .split(',')
    .map((part) => {
      const m = /^([+-]?\d{1,2})?(SU|MO|TU|WE|TH|FR|SA)$/.exec(part.trim().toUpperCase());
      if (!m) return null;
      return { ord: m[1] ? Number(m[1]) : 0, wd: WEEKDAYS.indexOf(m[2]) };
    })
    .filter((x): x is ByDay => x !== null);
}

function parseNumList(v: string | undefined): number[] {
  if (!v) return [];
  return v
    .split(',')
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n !== 0);
}

/** Giorni (civil day) di un mese che soddisfano BYDAY con ordinali (es. 2TU, -1FR, MO). */
function monthDaysByDay(y: number, mo: number, byDay: ByDay[]): number[] {
  const first = civilDay(y, mo, 1);
  const len = daysInMonth(y, mo);
  const out = new Set<number>();
  for (const { ord, wd } of byDay) {
    const matches: number[] = [];
    for (let i = 0; i < len; i++) {
      if (fromCivilDay(first + i).wd === wd) matches.push(first + i);
    }
    if (ord === 0) matches.forEach((m) => out.add(m));
    else {
      const idx = ord > 0 ? ord - 1 : matches.length + ord;
      if (matches[idx] !== undefined) out.add(matches[idx]);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/* ---------- RRULE ---------- */

const MAX_OCCURRENCES = 2000;

function expandRRule(
  rule: string,
  start: DateValue,
  windowFrom: number,
  windowTo: number
): DateValue[] {
  const parts: Record<string, string> = {};
  for (const kv of rule.split(';')) {
    const eq = kv.indexOf('=');
    if (eq > 0) parts[kv.slice(0, eq).toUpperCase()] = kv.slice(eq + 1);
  }
  const freq = parts.FREQ;
  const interval = Math.max(1, Number(parts.INTERVAL ?? 1) || 1);
  const count = parts.COUNT ? Number(parts.COUNT) : Infinity;
  const untilDv = parts.UNTIL ? parseDateValue(parts.UNTIL, {}) : null;
  const until = untilDv
    ? untilDv.allDay
      ? new Date(untilDv.y, untilDv.mo - 1, untilDv.d, 23, 59, 59).getTime()
      : toEpoch(untilDv.utc ? untilDv : { ...untilDv, tz: start.tz })
    : Infinity;
  const byDay = parseByDay(parts.BYDAY);
  const byMonthDay = parseNumList(parts.BYMONTHDAY);
  const byMonth = parseNumList(parts.BYMONTH);

  const startDay = civilDay(start.y, start.mo, start.d);
  const startWd = fromCivilDay(startDay).wd;
  const out: DateValue[] = [];
  let produced = 0;

  const emit = (day: number): boolean => {
    // ritorna false quando bisogna fermarsi
    if (day < startDay) return true;
    const c = fromCivilDay(day);
    const dv = withDate(start, c.y, c.mo, c.d);
    const epoch = toEpoch(dv);
    if (epoch > until || produced >= count) return false;
    if (epoch > windowTo) return false;
    produced++;
    out.push(dv);
    return produced < MAX_OCCURRENCES;
  };

  // Senza COUNT si può saltare direttamente vicino all'inizio della finestra
  // (es. un evento giornaliero che si ripete dal 2015).
  let kStart = 0;
  if (!Number.isFinite(count) && (freq === 'DAILY' || freq === 'WEEKLY')) {
    const periodDays = (freq === 'DAILY' ? 1 : 7) * interval;
    const fromDay = Math.floor(windowFrom / DAY_MS) - 2;
    kStart = Math.max(0, Math.floor((fromDay - startDay) / periodDays) - 1);
  }

  // Limite di sicurezza sui periodi iterati
  for (let k = kStart; k < kStart + 20000; k++) {
    let days: number[] = [];
    if (freq === 'DAILY') {
      days = [startDay + k * interval];
    } else if (freq === 'WEEKLY') {
      // settimana che parte dal lunedì (WKST=MO, default di Google)
      const mondayOffset = (startWd + 6) % 7;
      const weekStart = startDay - mondayOffset + k * interval * 7;
      const wds = byDay.length > 0 ? byDay.map((b) => b.wd) : [startWd];
      days = [...new Set(wds)].map((wd) => weekStart + ((wd + 6) % 7)).sort((a, b) => a - b);
    } else if (freq === 'MONTHLY') {
      const mIndex = start.mo - 1 + k * interval;
      const y = start.y + Math.floor(mIndex / 12);
      const mo = (mIndex % 12) + 1;
      if (byDay.length > 0) days = monthDaysByDay(y, mo, byDay);
      else {
        const len = daysInMonth(y, mo);
        const mds = byMonthDay.length > 0 ? byMonthDay : [start.d];
        days = mds
          .map((md) => (md > 0 ? md : len + md + 1))
          .filter((md) => md >= 1 && md <= len)
          .map((md) => civilDay(y, mo, md))
          .sort((a, b) => a - b);
      }
    } else if (freq === 'YEARLY') {
      const y = start.y + k * interval;
      const months = byMonth.length > 0 ? byMonth : [start.mo];
      for (const mo of months) {
        if (byDay.length > 0) days.push(...monthDaysByDay(y, mo, byDay));
        else {
          const len = daysInMonth(y, mo);
          const mds = byMonthDay.length > 0 ? byMonthDay : [start.d];
          for (const md0 of mds) {
            const md = md0 > 0 ? md0 : len + md0 + 1;
            if (md >= 1 && md <= len) days.push(civilDay(y, mo, md));
          }
        }
      }
      days.sort((a, b) => a - b);
    } else {
      // FREQ non supportata (HOURLY ecc.): solo la prima occorrenza
      emit(startDay);
      return out;
    }

    for (const day of days) {
      if (!emit(day)) return out;
    }
    // Fermati se l'intero periodo è oltre la finestra/UNTIL
    const last = days[days.length - 1];
    if (last !== undefined) {
      const c = fromCivilDay(last);
      if (toEpoch(withDate(start, c.y, c.mo, c.d)) > Math.min(until, windowTo)) return out;
    }
  }
  return out;
}

/* ---------- parse ---------- */

interface RawEvent {
  uid: string;
  title: string;
  location?: string;
  start?: DateValue;
  end?: DateValue;
  durationMs?: number;
  rrule?: string;
  exdates: number[];
  recurrenceId?: number;
  cancelled: boolean;
}

function parseRawEvents(text: string): { name?: string; raws: RawEvent[] } {
  const lines = unfold(text);
  const raws: RawEvent[] = [];
  let name: string | undefined;
  let cur: RawEvent | null = null;
  let depth = 0; // profondità di componenti annidati dentro VEVENT (es. VALARM)

  for (const line of lines) {
    if (!line) continue;
    const prop = parseLine(line);
    if (!prop) continue;

    if (prop.name === 'BEGIN') {
      if (prop.value.toUpperCase() === 'VEVENT' && !cur) {
        cur = { uid: '', title: '', exdates: [], cancelled: false };
        depth = 0;
      } else if (cur) depth++;
      continue;
    }
    if (prop.name === 'END') {
      if (cur && depth > 0) depth--;
      else if (cur && prop.value.toUpperCase() === 'VEVENT') {
        raws.push(cur);
        cur = null;
      }
      continue;
    }

    if (!cur) {
      if (prop.name === 'X-WR-CALNAME') name = unescapeText(prop.value);
      continue;
    }
    if (depth > 0) continue;

    switch (prop.name) {
      case 'UID':
        cur.uid = prop.value.trim();
        break;
      case 'SUMMARY':
        cur.title = unescapeText(prop.value);
        break;
      case 'LOCATION':
        cur.location = unescapeText(prop.value) || undefined;
        break;
      case 'DTSTART':
        cur.start = parseDateValue(prop.value, prop.params) ?? undefined;
        break;
      case 'DTEND':
        cur.end = parseDateValue(prop.value, prop.params) ?? undefined;
        break;
      case 'DURATION':
        cur.durationMs = parseDuration(prop.value) ?? undefined;
        break;
      case 'RRULE':
        cur.rrule = prop.value.trim();
        break;
      case 'EXDATE':
        for (const v of prop.value.split(',')) {
          const dv = parseDateValue(v, prop.params);
          if (dv) cur.exdates.push(toEpoch(dv));
        }
        break;
      case 'RECURRENCE-ID': {
        const dv = parseDateValue(prop.value, prop.params);
        if (dv) cur.recurrenceId = toEpoch(dv);
        break;
      }
      case 'STATUS':
        cur.cancelled = prop.value.trim().toUpperCase() === 'CANCELLED';
        break;
    }
  }
  return { name, raws };
}

function eventDurationMs(raw: RawEvent, start: DateValue): number {
  if (raw.end) {
    const d = toEpoch(raw.end) - toEpoch(start);
    if (d > 0) return d;
  }
  if (raw.durationMs !== undefined && raw.durationMs > 0) return raw.durationMs;
  return start.allDay ? DAY_MS : 0;
}

function makeEvent(raw: RawEvent, startDv: DateValue, durationMs: number): CalendarEvent {
  const start = toEpoch(startDv);
  let end: number;
  if (startDv.allDay) {
    // Per gli all-day calcola la fine in giorni civili (immune all'ora legale)
    const days = Math.max(1, Math.round(durationMs / DAY_MS));
    end = new Date(startDv.y, startDv.mo - 1, startDv.d + days).getTime();
  } else {
    end = start + durationMs;
  }
  return {
    id: `${raw.uid || raw.title}@${start}`,
    uid: raw.uid,
    title: raw.title || '(Senza titolo)',
    location: raw.location,
    start,
    end,
    allDay: startDv.allDay,
  };
}

/**
 * Converte un feed iCal in eventi concreti che cadono (anche parzialmente)
 * nella finestra indicata, con le ricorrenze espanse.
 */
export function parseIcal(text: string, window: ExpandWindow): ParsedCalendar {
  const { name, raws } = parseRawEvents(text);

  // Occorrenze modificate/cancellate: uid → set di RECURRENCE-ID
  const overridden = new Map<string, Set<number>>();
  for (const r of raws) {
    if (r.recurrenceId !== undefined && r.uid) {
      if (!overridden.has(r.uid)) overridden.set(r.uid, new Set());
      overridden.get(r.uid)!.add(r.recurrenceId);
    }
  }

  const events: CalendarEvent[] = [];
  const inWindow = (e: CalendarEvent) => e.end > window.from && e.start < window.to;

  for (const raw of raws) {
    if (!raw.start || raw.cancelled) continue;
    const duration = eventDurationMs(raw, raw.start);

    if (raw.rrule && raw.recurrenceId === undefined) {
      const skip = new Set<number>([...raw.exdates, ...(overridden.get(raw.uid) ?? [])]);
      for (const occ of expandRRule(raw.rrule, raw.start, window.from - duration, window.to)) {
        const ev = makeEvent(raw, occ, duration);
        if (skip.has(ev.start)) continue;
        if (inWindow(ev)) events.push(ev);
      }
    } else {
      const ev = makeEvent(raw, raw.start, duration);
      if (inWindow(ev)) events.push(ev);
    }
  }

  events.sort((a, b) => a.start - b.start || Number(b.allDay) - Number(a.allDay));
  return { name, events };
}

/** Eventi che toccano il giorno locale che inizia a `dayStart`. */
export function eventsOnDay(events: CalendarEvent[], dayStart: number): CalendarEvent[] {
  const d = new Date(dayStart);
  const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  return events
    .filter((e) => e.start < dayEnd && e.end > dayStart)
    .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start - b.start);
}

/** Insieme dei giorni (mezzanotte locale) che hanno almeno un evento. */
export function eventDaySet(events: CalendarEvent[]): Set<number> {
  const set = new Set<number>();
  for (const e of events) {
    const s = new Date(e.start);
    let cursor = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    // Un evento che finisce esattamente a mezzanotte non occupa il giorno successivo
    let guard = 0;
    while (cursor.getTime() < e.end && guard < 62) {
      set.add(cursor.getTime());
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
      guard++;
    }
    if (e.end === e.start) set.add(new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime());
  }
  return set;
}
