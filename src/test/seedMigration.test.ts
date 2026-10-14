/* ============================================
   SEED MIGRATION TESTS — UUID-preserving merge
   Verifies that upgrading sheetRevision never
   orphans workout history (sessionTemplateId /
   exerciseTemplateId references stay valid).
   ============================================ */

import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { workoutRepo, resetAllData } from '@/db/repositories'
import {
  seedDatabase,
  restoreDefaultProgram,
  CURRENT_SHEET_REVISION,
} from '@/db/seed'
import { useWorkoutStore } from '@/stores/workoutStore'
import { generateId } from '@/lib/ids'
import type { Program, SessionTemplate, ExerciseTemplate } from '@/types'

function makeExercise(overrides: Partial<ExerciseTemplate> = {}): ExerciseTemplate {
  return {
    id: generateId(),
    name: 'Chest Press',
    type: 'strength',
    order: 0,
    sets: 3,
    targetReps: 8,
    defaultWeight: 40,
    restSeconds: 90,
    ...overrides,
  }
}

function makeSession(
  name: string,
  exercises: ExerciseTemplate[],
  order = 0
): SessionTemplate {
  return {
    id: generateId(),
    name,
    order,
    exercises: exercises.map((e, i) => ({ ...e, order: i })),
  }
}

/** Builds an "old revision" program that predates CURRENT_SHEET_REVISION. */
async function seedOldProgram(sessions: SessionTemplate[]): Promise<Program> {
  const program: Program = {
    id: generateId(),
    name: 'La Mia Scheda',
    createdAt: Date.now(),
    durationWeeks: 8,
    sheetRevision: CURRENT_SHEET_REVISION - 1,
    sessions,
  }
  await db.programs.add(program)
  return program
}

beforeEach(async () => {
  await resetAllData()
  useWorkoutStore.setState({ activeWorkout: null, isLoading: false })
})

describe('seed migration preserves UUIDs (update mode)', () => {
  it('keeps session and exercise ids when bumping sheetRevision', async () => {
    const ex = makeExercise({ name: 'Chest Press', defaultWeight: 55 })
    const oldSession = makeSession('Seduta 1', [ex])
    const program = await seedOldProgram([oldSession])

    // Complete a workout against the old template so history references it
    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, oldSession)
    const logId = workout.exerciseLogs[0].id
    await useWorkoutStore.getState().completeSet(logId, {
      setNumber: 1,
      weight: 55,
      reps: 8,
      completedAt: Date.now(),
    })
    await useWorkoutStore.getState().completeExercise(logId)
    await useWorkoutStore.getState().completeWorkout()

    await seedDatabase()

    const migrated = await db.programs.get(program.id)
    expect(migrated?.sheetRevision).toBe(CURRENT_SHEET_REVISION)
    // Session UUID is preserved → sessionTemplateId still resolves
    expect(migrated?.sessions.map((s) => s.id)).toContain(oldSession.id)
    // Exercise UUID is preserved → exerciseTemplateId still resolves
    const migratedIds = migrated!.sessions.flatMap((s) => s.exercises.map((e) => e.id))
    expect(migratedIds).toContain(ex.id)

    // History still links back to the template
    const stored = await workoutRepo.getById(workout.id)
    expect(stored?.sessionTemplateId).toBe(oldSession.id)
    expect(stored?.exerciseLogs[0].exerciseTemplateId).toBe(ex.id)
    expect(migratedIds).toContain(stored!.exerciseLogs[0].exerciseTemplateId)
  })

  it('preserves the progressed defaultWeight of a trained exercise', async () => {
    const ex = makeExercise({ name: 'Chest Press', defaultWeight: 55 })
    const oldSession = makeSession('Seduta 1', [ex])
    const program = await seedOldProgram([oldSession])

    // User has trained this exercise → weight must survive the migration
    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, oldSession)
    expect(workout.exerciseLogs[0].exerciseTemplateId).toBe(ex.id)
    await useWorkoutStore.getState().completeWorkout()

    await seedDatabase()

    const migrated = await db.programs.get(program.id)
    const migratedEx = migrated!.sessions[0].exercises.find((e) => e.id === ex.id)
    expect(migratedEx?.defaultWeight).toBe(55)
  })

  it('refreshes an untrained exercise to the seed weight at the same slot', async () => {
    // Merge is positional: slot 0 of Seduta 1 in the seed is the first
    // exercise. An untrained template at that slot takes the seed's weight.
    const ex = makeExercise({ name: 'Vecchio Nome', defaultWeight: 10 })
    const oldSession = makeSession('Seduta 1', [ex])
    const program = await seedOldProgram([oldSession])

    await seedDatabase()

    const migrated = await db.programs.get(program.id)
    const mergedEx = migrated!.sessions[0].exercises.find((e) => e.id === ex.id)
    // No workout referenced it, so it was refreshed from the seed template
    // (the seed's first exercise is a 10-min cardio, so weight is undefined).
    expect(mergedEx).toBeDefined()
    expect(mergedEx!.defaultWeight).not.toBe(10)
  })

  it('keeps user sessions that are not part of the seed', async () => {
    const customSession = makeSession('La Mia Seduta Custom', [makeExercise()], 0)
    const program = await seedOldProgram([customSession])

    await seedDatabase()

    const migrated = await db.programs.get(program.id)
    expect(migrated?.sessions.map((s) => s.id)).toContain(customSession.id)
  })
})

describe('restore default program (reset mode)', () => {
  it('re-uses existing UUIDs so history is not orphaned', async () => {
    const ex = makeExercise()
    const oldSession = makeSession('Seduta 1', [ex])
    const program = await seedOldProgram([oldSession])

    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, oldSession)
    await useWorkoutStore.getState().completeWorkout()

    const restored = await restoreDefaultProgram()

    expect(restored.id).toBe(program.id)
    // At least one session re-uses the original UUID so the log still links
    const restoredIds = restored.sessions.map((s) => s.id)
    expect(restoredIds).toContain(oldSession.id)

    const stored = await workoutRepo.getById(workout.id)
    expect(restoredIds).toContain(stored!.sessionTemplateId)
  })

  it('resets a trained exercise back to the seed weight (reset semantics)', async () => {
    const ex = makeExercise({ name: 'Chest Press', defaultWeight: 55 })
    const oldSession = makeSession('Seduta 1', [ex])
    const program = await seedOldProgram([oldSession])

    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, oldSession)
    await useWorkoutStore.getState().completeWorkout()
    expect(workout.exerciseLogs[0].exerciseTemplateId).toBe(ex.id)

    const restored = await restoreDefaultProgram()
    const mergedEx = restored.sessions[0].exercises.find((e) => e.id === ex.id)
    // Reset mode restores the built-in value regardless of training history.
    expect(mergedEx?.defaultWeight).not.toBe(55)
  })
})

describe('seedDatabase idempotency', () => {
  it('is a no-op when already at the current revision', async () => {
    // First launch: no programs → seeds the default one
    await seedDatabase()
    const first = await db.programs.orderBy('createdAt').first()
    expect(first).toBeDefined()

    const before = JSON.stringify(first)
    await seedDatabase()
    const after = await db.programs.get(first!.id)
    expect(JSON.stringify(after)).toBe(before)
  })
})
