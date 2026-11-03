/* ============================================
   SYNC ENGINE — Local-First Bidirectional Sync
   Synchronizes IndexedDB (Dexie) with Supabase Cloud
   ============================================ */

import { supabase, isSupabaseConfigured } from './supabase';
import { db } from '@/db/database';
import { notifyTabSync } from './tabSync';
import type { Program, Workout, AppSettings } from '@/types';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  error: string | null;
}

let syncStatus: SyncStatus = {
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
};

const listeners = new Set<(status: SyncStatus) => void>();

function updateStatus(patch: Partial<SyncStatus>) {
  syncStatus = { ...syncStatus, ...patch };
  listeners.forEach((fn) => fn(syncStatus));
}

export function subscribeSyncStatus(fn: (status: SyncStatus) => void): () => void {
  listeners.add(fn);
  fn(syncStatus);
  return () => {
    listeners.delete(fn);
  };
}

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

/**
 * Pushes all locally created/updated programs and workouts to Supabase
 */
async function pushLocalToCloud(userId: string): Promise<void> {
  const [programs, workouts, settings] = await Promise.all([
    db.programs.toArray(),
    db.workouts.toArray(),
    db.settings.get('default'),
  ]);

  // 1. Push Programs
  if (programs.length > 0) {
    const payload = programs.map((p) => ({
      id: p.id,
      user_id: userId,
      name: p.name,
      duration_weeks: p.durationWeeks,
      start_date: p.startDate ? p.startDate.slice(0, 10) : null,
      sessions: p.sessions,
      created_at: new Date(p.createdAt).toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('programs').upsert(payload, { onConflict: 'id' });
    if (error) throw new Error(`Errore push schede: ${error.message}`);
  }

  // 2. Push Workouts
  if (workouts.length > 0) {
    const payload = workouts.map((w) => ({
      id: w.id,
      user_id: userId,
      program_id: w.programId,
      session_template_id: w.sessionTemplateId,
      session_name_snapshot: w.sessionNameSnapshot,
      started_at: w.startedAt,
      completed_at: w.completedAt ?? null,
      status: w.status,
      exercise_logs: w.exerciseLogs,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('workouts').upsert(payload, { onConflict: 'id' });
    if (error) throw new Error(`Errore push allenamenti: ${error.message}`);
  }

  // 3. Push Settings
  if (settings) {
    const payload = {
      user_id: userId,
      default_rest_seconds: settings.defaultRestSeconds ?? 120,
      sound_enabled: settings.soundEnabled ?? true,
      vibration_enabled: settings.vibrationEnabled ?? true,
      weekly_target: settings.weeklyTarget ?? 4,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
    if (error) throw new Error(`Errore push impostazioni: ${error.message}`);
  }
}

/**
 * Pulls programs, workouts, and settings from Supabase and updates local IndexedDB
 */
async function pullCloudToLocal(userId: string): Promise<void> {
  // 1. Pull Programs
  const { data: cloudPrograms, error: progErr } = await supabase
    .from('programs')
    .select('*')
    .eq('user_id', userId);

  if (progErr) throw new Error(`Errore pull schede: ${progErr.message}`);

  if (cloudPrograms && cloudPrograms.length > 0) {
    await db.transaction('rw', db.programs, async () => {
      for (const cp of cloudPrograms) {
        const localProg: Program = {
          id: cp.id,
          name: cp.name,
          durationWeeks: cp.duration_weeks,
          startDate: cp.start_date ?? undefined,
          createdAt: new Date(cp.created_at).getTime(),
          sessions: cp.sessions ?? [],
        };
        await db.programs.put(localProg);
      }
    });
  }

  // 2. Pull Workouts
  const { data: cloudWorkouts, error: workErr } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId);

  if (workErr) throw new Error(`Errore pull allenamenti: ${workErr.message}`);

  if (cloudWorkouts && cloudWorkouts.length > 0) {
    await db.transaction('rw', db.workouts, async () => {
      for (const cw of cloudWorkouts) {
        const localWorkout: Workout = {
          id: cw.id,
          programId: cw.program_id,
          sessionTemplateId: cw.session_template_id,
          sessionNameSnapshot: cw.session_name_snapshot,
          startedAt: Number(cw.started_at),
          completedAt: cw.completed_at ? Number(cw.completed_at) : undefined,
          status: cw.status,
          exerciseLogs: cw.exercise_logs ?? [],
        };
        await db.workouts.put(localWorkout);
      }
    });
  }

  // 3. Pull Settings
  const { data: cloudSettings, error: setErr } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!setErr && cloudSettings) {
    const localSettings: AppSettings & { id: string } = {
      id: 'default',
      defaultRestSeconds: cloudSettings.default_rest_seconds,
      soundEnabled: cloudSettings.sound_enabled,
      vibrationEnabled: cloudSettings.vibration_enabled,
      weeklyTarget: cloudSettings.weekly_target,
    };
    await db.settings.put(localSettings);
  }
}

/**
 * Main bidirectional sync routine
 */
export async function syncAll(userId?: string): Promise<{ success: boolean; error?: string }> {
  if (syncStatus.isSyncing) {
    return { success: true };
  }

  if (!isSupabaseConfigured() || !userId) {
    // Silent no-op when running offline or without credentials
    return { success: true };
  }

  updateStatus({ isSyncing: true, error: null });

  try {
    // Push local offline records first, then pull remote state
    await pushLocalToCloud(userId);
    await pullCloudToLocal(userId);

    const now = Date.now();
    updateStatus({ isSyncing: false, lastSyncedAt: now, error: null });
    notifyTabSync();
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto durante la sincronizzazione.';
    console.error('Sync failed:', err);
    updateStatus({ isSyncing: false, error: msg });
    return { success: false, error: msg };
  }
}
