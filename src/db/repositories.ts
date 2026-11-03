/* ============================================
   DB REPOSITORIES — Data access layer
   Pure async functions wrapping Dexie operations
   ============================================ */

import { db } from './database';
import { generateId } from '@/lib/ids';
import { notifyTabSync } from '@/lib/tabSync';
import type {
  Program,
  SessionTemplate,
  ExerciseTemplate,
  Workout,
  WorkoutExerciseLog,
  SetLog,
  AppSettings,
  AppState,
  TimerState,
  UUID,
} from '@/types';

/* ============================================
   PROGRAM REPOSITORY
   ============================================ */

export const programRepo = {
  async getAll(): Promise<Program[]> {
    return db.programs.orderBy('createdAt').toArray();
  },

  async getFirst(): Promise<Program | undefined> {
    return db.programs.orderBy('createdAt').first();
  },

  async getActive(): Promise<Program | undefined> {
    const appState = await appStateRepo.get();
    if (appState.activeProgramId) {
      const prog = await db.programs.get(appState.activeProgramId);
      if (prog) return prog;
    }
    return db.programs.orderBy('createdAt').first();
  },

  async setActive(programId: UUID): Promise<void> {
    await appStateRepo.setActiveProgram(programId);
  },

  async getById(id: UUID): Promise<Program | undefined> {
    return db.programs.get(id);
  },

  async update(program: Program): Promise<void> {
    await db.programs.put(program);
    notifyTabSync();
  },

  async updateSession(programId: UUID, session: SessionTemplate): Promise<void> {
    await db.transaction('rw', db.programs, async () => {
      const program = await db.programs.get(programId);
      if (!program) throw new Error(`Program ${programId} not found`);
      const idx = program.sessions.findIndex((s) => s.id === session.id);
      if (idx === -1) throw new Error(`Session ${session.id} not found in program`);
      program.sessions[idx] = session;
      await db.programs.put(program);
    });
    notifyTabSync();
  },

  async addSession(programId: UUID, session: SessionTemplate): Promise<void> {
    await db.transaction('rw', db.programs, async () => {
      const program = await db.programs.get(programId);
      if (!program) throw new Error(`Program ${programId} not found`);
      program.sessions.push(session);
      await db.programs.put(program);
    });
    notifyTabSync();
  },

  async deleteSession(programId: UUID, sessionId: UUID): Promise<void> {
    await db.transaction('rw', db.programs, async () => {
      const program = await db.programs.get(programId);
      if (!program) throw new Error(`Program ${programId} not found`);
      program.sessions = program.sessions.filter((s) => s.id !== sessionId);
      await db.programs.put(program);
    });
    notifyTabSync();
  },

  async updateExercise(
    programId: UUID,
    sessionId: UUID,
    exercise: ExerciseTemplate
  ): Promise<void> {
    await db.transaction('rw', db.programs, async () => {
      const program = await db.programs.get(programId);
      if (!program) throw new Error(`Program ${programId} not found`);
      const session = program.sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error(`Session ${sessionId} not found`);
      const idx = session.exercises.findIndex((e) => e.id === exercise.id);
      if (idx === -1) {
        // New exercise: append at the end of the session
        session.exercises.push({ ...exercise, order: session.exercises.length });
      } else {
        // Existing exercise: preserve its position in the session
        session.exercises[idx] = { ...exercise, order: session.exercises[idx].order };
      }
      await db.programs.put(program);
    });
    notifyTabSync();
  },

  async deleteExercise(
    programId: UUID,
    sessionId: UUID,
    exerciseId: UUID
  ): Promise<void> {
    await db.transaction('rw', db.programs, async () => {
      const program = await db.programs.get(programId);
      if (!program) throw new Error(`Program ${programId} not found`);
      const session = program.sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error(`Session ${sessionId} not found`);
      session.exercises = session.exercises.filter((e) => e.id !== exerciseId);
      await db.programs.put(program);
    });
    notifyTabSync();
  },

  async create(name: string, durationWeeks: number): Promise<Program> {
    const program: Program = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      durationWeeks,
      sessions: [],
    };
    await db.programs.add(program);
    notifyTabSync();
    return program;
  },

  async delete(id: UUID): Promise<void> {
    await db.programs.delete(id);
    notifyTabSync();
  },
};

/* ============================================
   WORKOUT REPOSITORY
   ============================================ */

export const workoutRepo = {
  async getAll(): Promise<Workout[]> {
    return db.workouts.orderBy('startedAt').reverse().toArray();
  },

  async getById(id: UUID): Promise<Workout | undefined> {
    return db.workouts.get(id);
  },

  async getActive(): Promise<Workout | undefined> {
    return db.workouts.where('status').equals('active').first();
  },

  async getCompleted(): Promise<Workout[]> {
    return db.workouts.where('status').equals('completed').reverse().sortBy('startedAt');
  },

  async getBySession(sessionTemplateId: UUID): Promise<Workout[]> {
    return db.workouts
      .where('sessionTemplateId')
      .equals(sessionTemplateId)
      .and((w) => w.status === 'completed')
      .reverse()
      .sortBy('startedAt');
  },

  async create(workout: Workout): Promise<Workout> {
    await db.workouts.add(workout);
    notifyTabSync();
    return workout;
  },

  async update(workout: Workout): Promise<void> {
    await db.workouts.put(workout);
    notifyTabSync();
  },

  async updateExerciseLog(
    workoutId: UUID,
    exerciseLog: WorkoutExerciseLog
  ): Promise<void> {
    await db.transaction('rw', db.workouts, async () => {
      const workout = await db.workouts.get(workoutId);
      if (!workout) throw new Error(`Workout ${workoutId} not found`);
      const idx = workout.exerciseLogs.findIndex((e) => e.id === exerciseLog.id);
      if (idx === -1) throw new Error(`Exercise log ${exerciseLog.id} not found`);
      workout.exerciseLogs[idx] = exerciseLog;
      await db.workouts.put(workout);
    });
    notifyTabSync();
  },

  async addSetLog(
    workoutId: UUID,
    exerciseLogId: UUID,
    setLog: SetLog
  ): Promise<void> {
    await db.transaction('rw', db.workouts, async () => {
      const workout = await db.workouts.get(workoutId);
      if (!workout) throw new Error(`Workout ${workoutId} not found`);
      const exLog = workout.exerciseLogs.find((e) => e.id === exerciseLogId);
      if (!exLog) throw new Error(`Exercise log ${exerciseLogId} not found`);
      exLog.setLogs.push(setLog);
      await db.workouts.put(workout);
    });
    notifyTabSync();
  },

  async complete(workoutId: UUID): Promise<void> {
    const workout = await db.workouts.get(workoutId);
    if (!workout) throw new Error(`Workout ${workoutId} not found`);
    workout.status = 'completed';
    workout.completedAt = Date.now();
    await db.workouts.put(workout);
    notifyTabSync();
  },

  async cancel(workoutId: UUID): Promise<void> {
    const workout = await db.workouts.get(workoutId);
    if (!workout) throw new Error(`Workout ${workoutId} not found`);
    workout.status = 'cancelled';
    workout.completedAt = Date.now();
    await db.workouts.put(workout);
    notifyTabSync();
  },

  /**
   * Cancels every workout still marked "active". There must be at most one
   * active workout at a time; leftovers from previous entry points or a
   * crashed session would otherwise stay "active" forever and never appear
   * in history.
   */
  async cancelAllActive(): Promise<void> {
    await db.workouts
      .where('status')
      .equals('active')
      .modify((workout) => {
        workout.status = 'cancelled';
        workout.completedAt = workout.completedAt ?? Date.now();
      });
  },

  /** Get the last completed workout for a specific exercise template */
  async getLastPerformanceForExercise(
    exerciseTemplateId: UUID
  ): Promise<WorkoutExerciseLog | undefined> {
    const completed = await db.workouts
      .where('status')
      .equals('completed')
      .reverse()
      .sortBy('startedAt');

    for (const workout of completed) {
      const exLog = workout.exerciseLogs.find(
        (e) => e.exerciseTemplateId === exerciseTemplateId && e.status === 'completed'
      );
      if (exLog) return exLog;
    }
    return undefined;
  },

  /** Get all completed workout exercise logs for a given exercise (for charts) */
  async getAllPerformancesForExercise(
    exerciseTemplateId: UUID
  ): Promise<Array<{ workoutDate: number; log: WorkoutExerciseLog }>> {
    const completed = await db.workouts
      .where('status')
      .equals('completed')
      .sortBy('startedAt');

    const results: Array<{ workoutDate: number; log: WorkoutExerciseLog }> = [];
    for (const workout of completed) {
      const exLog = workout.exerciseLogs.find(
        (e) => e.exerciseTemplateId === exerciseTemplateId && e.status === 'completed'
      );
      if (exLog) {
        results.push({ workoutDate: workout.startedAt, log: exLog });
      }
    }
    return results;
  },

  /**
   * Single-scan lookup of the last completed performance for MANY exercises
   * at once. Avoids the N+1 pattern where each exercise triggered its own full
   * scan of completed workouts. `beforeTimestamp` limits results to workouts
   * started strictly before that time (used to find the "previous" workout).
   */
  async getPreviousPerformances(
    exerciseTemplateIds: UUID[],
    beforeTimestamp: number
  ): Promise<Map<UUID, WorkoutExerciseLog>> {
    const completed = await db.workouts
      .where('status')
      .equals('completed')
      .reverse()
      .sortBy('startedAt');

    const wanted = new Set(exerciseTemplateIds);
    const result = new Map<UUID, WorkoutExerciseLog>();

    for (const workout of completed) {
      if (workout.startedAt >= beforeTimestamp) continue;
      for (const exLog of workout.exerciseLogs) {
        if (result.has(exLog.exerciseTemplateId)) continue;
        if (!wanted.has(exLog.exerciseTemplateId)) continue;
        if (exLog.status !== 'completed') continue;
        result.set(exLog.exerciseTemplateId, exLog);
      }
      if (result.size === wanted.size) break;
    }
    return result;
  },

  async deleteAll(): Promise<void> {
    await db.workouts.clear();
    notifyTabSync();
  },
};

/* ============================================
   SETTINGS REPOSITORY
   ============================================ */

export const settingsRepo = {
  async get(): Promise<AppSettings> {
    const settings = await db.settings.get('default');
    if (!settings) {
      // Return defaults if not found
      return {
        defaultRestSeconds: 90,
        soundEnabled: true,
        vibrationEnabled: true,
        weeklyTarget: 4,
      };
    }
    return settings;
  },

  async update(settings: Partial<AppSettings>): Promise<void> {
    // Read-modify-write inside a transaction: two quick updates (e.g. rapidly
    // tapping the weekly target) must not overwrite each other.
    await db.transaction('rw', db.settings, async () => {
      const current = await db.settings.get('default');
      if (current) {
        await db.settings.put({ ...current, ...settings });
      } else {
        await db.settings.put({
          id: 'default',
          defaultRestSeconds: 90,
          soundEnabled: true,
          vibrationEnabled: true,
          weeklyTarget: 4,
          ...settings,
        });
      }
    });
    notifyTabSync();
  },
};

/* ============================================
   APP STATE REPOSITORY
   ============================================ */

export const appStateRepo = {
  async get(): Promise<AppState> {
    const state = await db.appState.get('default');
    return state ?? { id: 'default' };
  },

  async setActiveWorkout(workoutId: UUID | undefined): Promise<void> {
    // Transactions serialize read-modify-write updates, so a timer update
    // firing at the same time cannot clobber the active-workout pointer
    // (and vice versa).
    await db.transaction('rw', db.appState, async () => {
      const state = (await db.appState.get('default')) ?? { id: 'default' };
      await db.appState.put({ ...state, activeWorkoutId: workoutId });
    });
    notifyTabSync();
  },

  async setActiveProgram(programId: UUID | undefined): Promise<void> {
    await db.transaction('rw', db.appState, async () => {
      const state = (await db.appState.get('default')) ?? { id: 'default' };
      await db.appState.put({ ...state, activeProgramId: programId });
    });
    notifyTabSync();
  },

  async setTimerState(timerState: TimerState | undefined): Promise<void> {
    await db.transaction('rw', db.appState, async () => {
      const state = (await db.appState.get('default')) ?? { id: 'default' };
      await db.appState.put({ ...state, timerState });
    });
  },

  async clear(): Promise<void> {
    await db.appState.put({ id: 'default' });
    notifyTabSync();
  },
};

/* ============================================
   RESET REPOSITORY
   ============================================ */

export async function resetAllData(): Promise<void> {
  await db.transaction('rw', [db.programs, db.workouts, db.settings, db.appState], async () => {
    await db.programs.clear();
    await db.workouts.clear();
    await db.settings.clear();
    await db.appState.clear();
  });
  notifyTabSync();
}
