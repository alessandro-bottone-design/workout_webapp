/* ============================================
   GYM SCHEDULE — Orari di apertura della palestra
   ============================================ */

export interface GymTimeSlot {
  openMinutes: number; // minutes from midnight (e.g. 7 * 60 = 420)
  closeMinutes: number; // minutes from midnight (e.g. 22 * 60 + 30 = 1350)
  openFormatted: string;
  closeFormatted: string;
}

export interface GymScheduleEntry {
  dayLabel: string;
  shortLabel: string;
  hoursFormatted: string;
  days: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  slot: GymTimeSlot;
}

export const GYM_SCHEDULE: GymScheduleEntry[] = [
  {
    dayLabel: 'Lunedì – Venerdì',
    shortLabel: 'Lun – Ven',
    hoursFormatted: '07:00 – 22:30',
    days: [1, 2, 3, 4, 5],
    slot: {
      openMinutes: 7 * 60,
      closeMinutes: 22 * 60 + 30,
      openFormatted: '07:00',
      closeFormatted: '22:30',
    },
  },
  {
    dayLabel: 'Sabato',
    shortLabel: 'Sabato',
    hoursFormatted: '09:00 – 18:00',
    days: [6],
    slot: {
      openMinutes: 9 * 60,
      closeMinutes: 18 * 60,
      openFormatted: '09:00',
      closeFormatted: '18:00',
    },
  },
  {
    dayLabel: 'Domenica',
    shortLabel: 'Domenica',
    hoursFormatted: '09:00 – 12:00',
    days: [0],
    slot: {
      openMinutes: 9 * 60,
      closeMinutes: 12 * 60,
      openFormatted: '09:00',
      closeFormatted: '12:00',
    },
  },
];

export interface GymStatus {
  isOpen: boolean;
  statusText: string;
  detailText: string;
  todayScheduleText: string;
}

/**
 * Returns current opening status for the gym based on local date/time.
 */
export function getGymStatus(date: Date = new Date()): GymStatus {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const todayEntry = GYM_SCHEDULE.find((entry) => entry.days.includes(day)) ?? GYM_SCHEDULE[0];
  const { slot } = todayEntry;

  // Determine tomorrow's opening
  const tomorrowDay = (day + 1) % 7;
  const tomorrowEntry = GYM_SCHEDULE.find((entry) => entry.days.includes(tomorrowDay)) ?? GYM_SCHEDULE[0];

  if (currentMinutes >= slot.openMinutes && currentMinutes < slot.closeMinutes) {
    return {
      isOpen: true,
      statusText: 'Aperta ora',
      detailText: `Fino alle ${slot.closeFormatted}`,
      todayScheduleText: `Oggi: ${slot.openFormatted} – ${slot.closeFormatted}`,
    };
  }

  if (currentMinutes < slot.openMinutes) {
    return {
      isOpen: false,
      statusText: 'Chiusa ora',
      detailText: `Apre oggi alle ${slot.openFormatted}`,
      todayScheduleText: `Oggi: ${slot.openFormatted} – ${slot.closeFormatted}`,
    };
  }

  // Already closed for today
  return {
    isOpen: false,
    statusText: 'Chiusa ora',
    detailText: `Riapre domani alle ${tomorrowEntry.slot.openFormatted}`,
    todayScheduleText: `Oggi: ${slot.openFormatted} – ${slot.closeFormatted}`,
  };
}
