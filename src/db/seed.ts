/* ============================================
   SEED DATA — Scheda Allenamento Ufficiale (V2)
   4 Sedute personalizzate + Auto-migrazione
   ============================================ */

import { db } from './database';
import { generateId } from '@/lib/ids';
import type {
  Program,
  AppSettings,
  AppState,
  SessionTemplate,
  ExerciseTemplate,
  UUID,
} from '@/types';

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
  weeklyTarget: 4,
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
 * Collects every exerciseTemplateId referenced by any workout (active,
 * completed, or cancelled). Used by the seed merge to decide which weights
 * the user has actually progressed and must not be overwritten.
 */
async function collectTrainedExerciseIds(): Promise<Set<UUID>> {
  const workouts = await db.workouts.toArray();
  const ids = new Set<UUID>();
  for (const w of workouts) {
    for (const log of w.exerciseLogs) {
      ids.add(log.exerciseTemplateId);
    }
  }
  return ids;
}

type MergeMode = 'update' | 'reset';

/**
 * Merges fresh seed templates into the existing session list, PRESERVING
 * existing session/exercise UUIDs so workout history (which references
 * sessionTemplateId / exerciseTemplateId) is never orphaned.
 *
 * - 'update' (sheet-revision migration): keeps the user's extra sessions and
 *   exercises that aren't in the seed, and preserves the defaultWeight of any
 *   exercise the user has already trained (progressed load).
 * - 'reset' (explicit "restore defaults"): takes fresh seed content wholesale
 *   but still re-uses existing UUIDs by matching position, so history survives.
 *
 * Matching is positional (by `order`) because the seed defines the canonical
 * slot ordering for a given sheet revision.
 */
function mergeSessions(
  existing: SessionTemplate[],
  fresh: SessionTemplate[],
  trainedExerciseIds: Set<UUID>,
  mode: MergeMode
): SessionTemplate[] {
  const result: SessionTemplate[] = [];
  const len = Math.max(existing.length, fresh.length);

  for (let i = 0; i < len; i++) {
    const ex = existing[i];
    const fr = fresh[i];

    if (!fr) {
      // Seed has no session here. In 'update' keep the user's; in 'reset' drop it.
      if (mode === 'update' && ex) result.push({ ...ex, order: i });
      continue;
    }

    if (!ex) {
      // Brand-new seed session — safe to use fresh UUIDs (no history points here).
      result.push({ ...fr, order: i });
      continue;
    }

    // Both exist — merge, re-using the existing session UUID.
    result.push({
      ...fr,
      id: ex.id,
      order: i,
      exercises: mergeExercises(ex.exercises, fr.exercises, trainedExerciseIds, mode),
    });
  }

  return result;
}

function mergeExercises(
  existing: ExerciseTemplate[],
  fresh: ExerciseTemplate[],
  trainedExerciseIds: Set<UUID>,
  mode: MergeMode
): ExerciseTemplate[] {
  const result: ExerciseTemplate[] = [];
  const len = Math.max(existing.length, fresh.length);

  for (let i = 0; i < len; i++) {
    const ex = existing[i];
    const fr = fresh[i];

    if (!fr) {
      // Seed has no exercise here. In 'update' keep the user's custom one.
      if (mode === 'update' && ex) result.push({ ...ex, order: i });
      continue;
    }

    if (!ex) {
      result.push({ ...fr, order: i });
      continue;
    }

    // Both exist — re-use existing UUID. In 'update' mode, if the user has
    // trained this exercise, keep their progressed defaultWeight.
    const keepUserWeight = mode === 'update' && trainedExerciseIds.has(ex.id) && ex.defaultWeight !== undefined;
    result.push({
      ...fr,
      id: ex.id,
      order: i,
      defaultWeight: keepUserWeight ? ex.defaultWeight : fr.defaultWeight,
    });
  }

  return result;
}

/**
 * Single-flight guard for the seed run.
 *
 * In dev React.StrictMode mounts AppInitializer's effect twice (mount →
 * unmount → mount), so seedDatabase() is called twice back to back. Both runs
 * read the DB before either has written, then both try to insert the same
 * singleton rows ("default") and the second one throws
 * `ConstraintError: Key already exists`, which surfaced as
 * "Errore di inizializzazione del database" on every page load.
 *
 * Everyone awaits the same run; the entry is cleared as soon as the run
 * settles, so a later call (a retry, or a fresh DB in tests) runs again.
 */
let seedRun: Promise<void> | null = null;

export function seedDatabase(): Promise<void> {
  if (!seedRun) {
    seedRun = performSeed().finally(() => {
      seedRun = null;
    });
  }
  return seedRun;
}

/**
 * Seeds the database with demo data on first launch,
 * and auto-migrates existing programs to V2 if they are on an older revision.
 */
async function performSeed(): Promise<void> {
  const existingPrograms = await db.programs.toArray();
  const existingSettings = await db.settings.get('default');
  const existingAppState = await db.appState.get('default');

  if (existingPrograms.length === 0) {
    const program = buildDefaultProgram();
    await db.programs.add(program);
  } else {
    // Check if the program is an older revision. If so, migrate to V2
    // while preserving session/exercise UUIDs (never orphan workout history).
    const current = existingPrograms[0];
    if (!current.sheetRevision || current.sheetRevision < CURRENT_SHEET_REVISION) {
      const fresh = buildDefaultProgram();
      const trainedIds = await collectTrainedExerciseIds();
      const sessions = mergeSessions(current.sessions, fresh.sessions, trainedIds, 'update');
      await db.programs.put({
        ...current,
        name: SEED_PROGRAM.name,
        sheetRevision: CURRENT_SHEET_REVISION,
        sessions,
      });
    }
  }

  // Seed settings if not present (put = idempotent on the "default" key)
  if (!existingSettings) {
    await db.settings.put(DEFAULT_SETTINGS);
  }

  // Initialize app state if not present
  if (!existingAppState) {
    await db.appState.put(DEFAULT_APP_STATE);
  }
}

/**
 * Force resets the program to the latest built-in version without losing
 * workout history: session/exercise UUIDs are re-used by positional match so
 * existing logs stay linked, but content is taken fresh from the seed.
 */
export async function restoreDefaultProgram(): Promise<Program> {
  const existingPrograms = await db.programs.toArray();
  const fresh = buildDefaultProgram();
  if (existingPrograms.length > 0) {
    const current = existingPrograms[0];
    const trainedIds = await collectTrainedExerciseIds();
    const sessions = mergeSessions(current.sessions, fresh.sessions, trainedIds, 'reset');
    const updated: Program = {
      ...current,
      name: SEED_PROGRAM.name,
      sheetRevision: CURRENT_SHEET_REVISION,
      sessions,
    };
    await db.programs.put(updated);
    return updated;
  }
  await db.programs.add(fresh);
  return fresh;
}
