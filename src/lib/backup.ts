/* ============================================
   BACKUP / EXPORT / IMPORT UTILITIES
   JSON export & restore for IndexedDB data
   ============================================ */

import { db } from '@/db/database';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTimerStore } from '@/features/timer/timerStore';
import { notifyTabSync } from '@/lib/tabSync';
import type { Program, Workout, AppSettings, AppState } from '@/types';

export interface BackupPayload {
  schemaVersion: number;
  exportedAt: string;
  app: string;
  data: {
    programs: Program[];
    workouts: Workout[];
    settings: (AppSettings & { id: string })[];
    appState: AppState[];
  };
}

export async function createBackupPayload(): Promise<BackupPayload> {
  const [programs, workouts, settings, appState] = await Promise.all([
    db.programs.toArray(),
    db.workouts.toArray(),
    db.settings.toArray(),
    db.appState.toArray(),
  ]);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: 'workout-app',
    data: {
      programs,
      workouts,
      settings,
      appState,
    },
  };
}

export async function downloadBackupFile(): Promise<void> {
  const payload = await createBackupPayload();
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `workout-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  programCount: number;
  workoutCount: number;
}

export async function importBackupData(jsonString: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Il file selezionato non è un JSON valido.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Formato backup non valido.');
  }

  const rawObj = parsed as Record<string, unknown>;
  const rawData =
    rawObj.data && typeof rawObj.data === 'object'
      ? (rawObj.data as Record<string, unknown>)
      : rawObj;

  const programs = (Array.isArray(rawData.programs) ? rawData.programs : []) as Program[];
  const workouts = (Array.isArray(rawData.workouts) ? rawData.workouts : []) as Workout[];
  const settings = (Array.isArray(rawData.settings)
    ? rawData.settings
    : []) as (AppSettings & { id: string })[];
  const appState = (Array.isArray(rawData.appState) ? rawData.appState : []) as AppState[];

  if (programs.length === 0 && workouts.length === 0) {
    throw new Error('Il file di backup non contiene schede né allenamenti validi.');
  }

  await db.transaction('rw', [db.programs, db.workouts, db.settings, db.appState], async () => {
    await db.programs.clear();
    if (programs.length > 0) {
      await db.programs.bulkAdd(programs);
    }

    await db.workouts.clear();
    if (workouts.length > 0) {
      await db.workouts.bulkAdd(workouts);
    }

    await db.settings.clear();
    if (settings.length > 0) {
      await db.settings.bulkAdd(settings);
    }

    await db.appState.clear();
    if (appState.length > 0) {
      await db.appState.bulkAdd(appState);
    }
  });

  // Reset in-memory stores
  useTimerStore.setState({ timer: null });
  useWorkoutStore.getState().clearActiveWorkout();
  void useWorkoutStore.getState().loadActiveWorkout();

  // Notify other tabs
  notifyTabSync();

  return {
    programCount: programs.length,
    workoutCount: workouts.length,
  };
}
