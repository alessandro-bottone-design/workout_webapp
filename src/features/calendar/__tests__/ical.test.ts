import { describe, it, expect } from 'vitest';
import { parseIcal, eventsOnDay, eventDaySet } from '@features/calendar/ical';

describe('parseIcal', () => {
  const NOV_FROM = new Date(2026, 10, 1).getTime(); // 1 Nov 2026
  const NOV_TO = new Date(2026, 11, 1).getTime();   // 1 Dec 2026

  it('parses single timed event, unescapes text and extracts calendar name', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'X-WR-CALNAME:Calendario Ale',
      'BEGIN:VEVENT',
      'UID:evt-1@google.com',
      'SUMMARY:Riunione\\, Team',
      'LOCATION:Milano\\; Ufficio',
      'DTSTART;TZID=Europe/Rome:20261112T093000',
      'DTEND;TZID=Europe/Rome:20261112T104500',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const res = parseIcal(ics, { from: NOV_FROM, to: NOV_TO });
    expect(res.name).toBe('Calendario Ale');
    expect(res.events).toHaveLength(1);
    const ev = res.events[0];
    expect(ev.title).toBe('Riunione, Team');
    expect(ev.location).toBe('Milano; Ufficio');
    expect(ev.allDay).toBe(false);
    expect(ev.end - ev.start).toBe(75 * 60_000);
  });

  it('parses folded lines and all-day events without spilling to next day', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:allday-1',
      'SUMMARY:Giornata lunga con',
      '  titolo ripiegato',
      'DTSTART;VALUE=DATE:20261115',
      'DTEND;VALUE=DATE:20261116',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const res = parseIcal(ics, { from: NOV_FROM, to: NOV_TO });
    expect(res.events).toHaveLength(1);
    expect(res.events[0].title).toBe('Giornata lunga con titolo ripiegato');
    expect(res.events[0].allDay).toBe(true);

    const days = eventDaySet(res.events);
    expect(days.has(new Date(2026, 10, 15).getTime())).toBe(true);
    expect(days.has(new Date(2026, 10, 16).getTime())).toBe(false);
    expect(eventsOnDay(res.events, new Date(2026, 10, 15).getTime())).toHaveLength(1);
  });

  it('expands weekly RRULE, skips EXDATE and applies RECURRENCE-ID override', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:rec-1',
      'SUMMARY:Palestra',
      'DTSTART;TZID=Europe/Rome:20261102T180000',
      'DTEND;TZID=Europe/Rome:20261102T190000',
      'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=5',
      'EXDATE;TZID=Europe/Rome:20261109T180000',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:rec-1',
      'RECURRENCE-ID;TZID=Europe/Rome:20261111T180000',
      'SUMMARY:Palestra (Spostata)',
      'DTSTART;TZID=Europe/Rome:20261111T193000',
      'DTEND;TZID=Europe/Rome:20261111T203000',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const res = parseIcal(ics, { from: NOV_FROM, to: NOV_TO });
    // Occurrences: Nov 2 (Mon), Nov 4 (Wed), [Nov 9 skipped], Nov 11 (override 19:30), Nov 16 (Mon)
    expect(res.events).toHaveLength(4);
    expect(res.events.map((e) => new Date(e.start).getDate())).toEqual([2, 4, 11, 16]);
    const wed11 = res.events[2];
    expect(wed11.title).toBe('Palestra (Spostata)');
  });

  it('ignores STATUS:CANCELLED events and VALARM nested blocks', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:ok-1',
      'SUMMARY:Visita',
      'DTSTART:20261120T100000Z',
      'DURATION:PT1H',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'SUMMARY:Promemoria interno da ignorare',
      'END:VALARM',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:cancel-1',
      'SUMMARY:Cancellato',
      'STATUS:CANCELLED',
      'DTSTART:20261121T100000Z',
      'DTEND:20261121T110000Z',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const res = parseIcal(ics, { from: NOV_FROM, to: NOV_TO });
    expect(res.events).toHaveLength(1);
    expect(res.events[0].title).toBe('Visita');
    expect(res.events[0].end - res.events[0].start).toBe(3600_000);
  });
});
