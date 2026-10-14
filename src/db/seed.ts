/* ============================================
   SEED DATA — Scheda Allenamento Ufficiale (V2)
   4 Sedute personalizzate + Auto-migrazione
   ============================================ */

import { db } from './database';
import { generateId } from '@/lib/ids';
import type { Program, AppSettings, AppState } from '@/types';

export const CURRENT_SHEET_REVISION = 2;

export const SEED_PROGRAM: Omit<Program, 'id' | 'createdAt'> = {
  name: 'Scheda Allenamento',
  durationWeeks: 8,
  sheetRevision: CURRENT_SHEET_REVISION,
  sessions: [
    {
      id: generateId(),
      name: 'Seduta 1',
      order: 0,
      exercises: [
        {
          id: generateId(),
          name: 'Cyclette',
          type: 'cardio',
          order: 0,
          durationSeconds: 10 * 60,
          notes: '10 min riscaldamento',
        },
        {
          id: generateId(),
          name: 'Chest Press',
          type: 'strength',
          order: 1,
          sets: 3,
          targetReps: 8,
          defaultWeight: 52,
          restSeconds: 120,
          notes: 'Drop set: 8 rip con 52kg + 8 rip con 45kg senza pausa',
        },
        {
          id: generateId(),
          name: 'Panca 45° al multipower',
          type: 'strength',
          order: 2,
          sets: 3,
          targetReps: 6,
          defaultWeight: 35,
          restSeconds: 120,
          notes: 'Bilanciere multipower circa 10kg incluso nel totale',
        },
        {
          id: generateId(),
          name: 'Lat Machine Maniglia Singola',
          type: 'strength',
          order: 3,
          sets: 4,
          targetReps: 8,
          defaultWeight: 20.3,
          restSeconds: 120,
        },
        {
          id: generateId(),
          name: 'Alzate Laterali Cavo Medio',
          type: 'strength',
          order: 4,
          sets: 3,
          targetReps: 8,
          defaultWeight: 10,
          restSeconds: 120,
        },
        {
          id: generateId(),
          name: 'Tapis Roulant',
          type: 'cardio',
          order: 5,
          durationSeconds: 30 * 60,
          notes: '20 min a velocità 6.2 + 10 min a velocità 4.0 senza inclinazione',
        },
      ],
    },
    {
      id: generateId(),
      name: 'Seduta 2',
      order: 1,
      exercises: [
        {
          id: generateId(),
          name: 'Ellittica',
          type: 'cardio',
          order: 0,
          durationSeconds: 6 * 60,
          notes: '6 min riscaldamento',
        },
        {
          id: generateId(),
          name: 'Leg Extension',
          type: 'strength',
          order: 1,
          sets: 4,
          targetReps: 8,
          defaultWeight: 59,
          restSeconds: 120,
        },
        {
          id: generateId(),
          name: 'Leg Press Piedi stretti',
          type: 'strength',
          order: 2,
          sets: 3,
          targetReps: 8,
          defaultWeight: 79,
          restSeconds: 120,
        },
        {
          id: generateId(),
          name: 'Reverse Fly Machine',
          type: 'strength',
          order: 3,
          sets: 3,
          targetReps: 12,
          defaultWeight: 32,
          restSeconds: 120,
        },
        {
          id: generateId(),
          name: 'Lento Avanti Manubri',
          type: 'strength',
          order: 4,
          sets: 3,
          targetReps: 8,
          defaultWeight: 16,
          restSeconds: 120,
        },
        {
          id: generateId(),
          name: 'Tapis Roulant',
          type: 'cardio',
          order: 5,
          durationSeconds: 30 * 60,
          notes: '20 min a velocità 6.2 + 10 min a velocità 4.0 senza inclinazione',
        },
      ],
    },
    {
      id: generateId(),
      name: 'Seduta 3',
      order: 2,
      exercises: [
        {
          id: generateId(),
          name: 'Tapis Roulant Riscaldamento',
          type: 'cardio',
          order: 0,
          durationSeconds: 10 * 60,
          notes: '10 min riscaldamento',
        },
        {
          id: generateId(),
          name: 'Leg Curl Monopodalica',
          type: 'strength',
          order: 1,
          sets: 3,
          targetReps: 8,
          defaultWeight: 32,
          restSeconds: 120,
        },
        {
          id: generateId(),
          name: 'Stacchi Manubri (gambe leggermente piegate)',
          type: 'strength',
          order: 2,
          sets: 3,
          targetReps: 8,
          defaultWeight: 18,
          restSeconds: 120,
        },
        {
          id: generateId(),
          name: 'Adductor + Abductor (Superserie)',
          type: 'strength',
          order: 3,
          sets: 3,
          targetReps: 10,
          defaultWeight: 36,
          restSeconds: 120,
          notes: 'Superserie: 10 rip Adductor + 10 rip Abductor con 36kg',
        },
        {
          id: generateId(),
          name: 'Russian Twist con Kettlebell',
          type: 'strength',
          order: 4,
          sets: 3,
          targetReps: 12,
          defaultWeight: 8,
          restSeconds: 120,
        },
        {
          id: generateId(),
          name: 'Plank',
          type: 'strength',
          order: 5,
          sets: 3,
          targetReps: 1,
          defaultWeight: 0,
          restSeconds: 60,
          notes: 'Massima tenuta',
        },
        {
          id: generateId(),
          name: 'Tapis Roulant',
          type: 'cardio',
          order: 6,
          durationSeconds: 30 * 60,
          notes: '20 min a velocità 6.2 + 10 min a velocità 4.0 senza inclinazione',
        },
      ],
    },
    {
      id: generateId(),
      name: 'Seduta 4',
      order: 3,
      exercises: [
        {
          id: generateId(),
          name: 'Rematore Manubrio',
          type: 'strength',
          order: 0,
          sets: 3,
          targetReps: 8,
          defaultWeight: 24,
          restSeconds: 120,
        },
        {
          id: generateId(),
          name: 'Pull Down Asta',
          type: 'strength',
          order: 1,
          sets: 3,
          targetReps: 12,
          defaultWeight: 18,
          restSeconds: 120,
        },
        {
          id: generateId(),
          name: 'Curl Bilanciere EZ Panca Scott',
          type: 'strength',
          order: 2,
          sets: 3,
          targetReps: 8,
          defaultWeight: 20,
          restSeconds: 120,
          notes: '18 / 20 kg',
        },
        {
          id: generateId(),
          name: 'Tricipiti Corda',
          type: 'strength',
          order: 3,
          sets: 4,
          targetReps: 8,
          defaultWeight: 14,
          restSeconds: 120,
        },
        {
          id: generateId(),
          name: 'Tapis Roulant',
          type: 'cardio',
          order: 4,
          durationSeconds: 30 * 60,
          notes: '20 min a velocità 6.2 + 10 min a velocità 4.0 senza inclinazione',
        },
      ],
    },
  ],
};

const DEFAULT_SETTINGS: AppSettings & { id: string } = {
  id: 'default',
  defaultRestSeconds: 120,
  soundEnabled: true,
  vibrationEnabled: true,
};

const DEFAULT_APP_STATE: AppState = {
  id: 'default',
  activeWorkoutId: undefined,
  timerState: undefined,
};

export function buildDefaultProgram(): Program {
  return {
    id: generateId(),
    name: SEED_PROGRAM.name,
    createdAt: Date.now(),
    durationWeeks: SEED_PROGRAM.durationWeeks,
    sheetRevision: CURRENT_SHEET_REVISION,
    sessions: SEED_PROGRAM.sessions.map((s, sIdx) => ({
      ...s,
      id: generateId(),
      order: sIdx,
      exercises: s.exercises.map((e, eIdx) => ({
        ...e,
        id: generateId(),
        order: eIdx,
      })),
    })),
  };
}

/**
 * Seeds the database with demo data on first launch,
 * and auto-migrates existing programs to V2 if they are on an older revision.
 */
export async function seedDatabase(): Promise<void> {
  const existingPrograms = await db.programs.toArray();
  const existingSettings = await db.settings.get('default');
  const existingAppState = await db.appState.get('default');

  if (existingPrograms.length === 0) {
    const program = buildDefaultProgram();
    await db.programs.add(program);
  } else {
    // Check if the program is an older revision. If so, update sessions to V2.
    const current = existingPrograms[0];
    if (!current.sheetRevision || current.sheetRevision < CURRENT_SHEET_REVISION) {
      const fresh = buildDefaultProgram();
      await db.programs.put({
        ...current,
        name: SEED_PROGRAM.name,
        sheetRevision: CURRENT_SHEET_REVISION,
        sessions: fresh.sessions,
      });
    }
  }

  // Seed settings if not present
  if (!existingSettings) {
    await db.settings.add(DEFAULT_SETTINGS);
  }

  // Initialize app state if not present
  if (!existingAppState) {
    await db.appState.add(DEFAULT_APP_STATE);
  }
}

/**
 * Force resets the program to the latest built-in version without losing workout history.
 */
export async function restoreDefaultProgram(): Promise<Program> {
  const existingPrograms = await db.programs.toArray();
  const fresh = buildDefaultProgram();
  if (existingPrograms.length > 0) {
    const current = existingPrograms[0];
    const updated: Program = {
      ...current,
      name: SEED_PROGRAM.name,
      sheetRevision: CURRENT_SHEET_REVISION,
      sessions: fresh.sessions,
    };
    await db.programs.put(updated);
    return updated;
  }
  await db.programs.add(fresh);
  return fresh;
}
