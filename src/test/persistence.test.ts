/* ============================================
   INTEGRATION TESTS — Real IndexedDB via fake-indexeddb
   Covers the critical product guarantees:
   - set / exercise / workout completion persistence
   - active workout + timer recovery after "reload"
   - history snapshot isolation from program edits
   ============================================ */

import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import {
  workoutRepo,
  programRepo,
  appStateRepo,
  settingsRepo,
  resetAllData,
} from '@/db/repositories'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useTimerStore } from '@/features/timer/timerStore'
import { generateId } from '@/lib/ids'
import { formatWeight, formatWeightValue, parseWeight } from '@/lib/formatters'
import type { Program, SessionTemplate, ExerciseTemplate } from '@/types'

/* ---------- fixtures ---------- */

function makeExercise(overrides: Partial<ExerciseTemplate> = {}): ExerciseTemplate {
  return {
    id: generateId(),
    name: 'Chest Press',
    type: 'strength',
    order: 0,
    sets: 3,
    targetReps: 8,
    defaultWeight: 45,
    restSeconds: 90,
    ...overrides,
  }
}

function makeSession(exercises: ExerciseTemplate[]): SessionTemplate {
  return {
    id: generateId(),
    name: 'Seduta 1',
    order: 0,
    exercises: exercises.map((e, i) => ({ ...e, order: i })),
  }
}

async function seedProgram(session: SessionTemplate): Promise<Program> {
  const program: Program = {
    id: generateId(),
    name: 'La Mia Scheda',
    createdAt: Date.now(),
    durationWeeks: 8,
    sessions: [session],
  }
  await db.programs.add(program)
  return program
}

/** Simulates a full browser reload of the ephemeral stores */
function simulateReload() {
  useWorkoutStore.setState({ activeWorkout: null, isLoading: false })
  useTimerStore.setState({ timer: null })
}

async function loadApp() {
  await useTimerStore.getState().loadFromDB()
  await useWorkoutStore.getState().loadActiveWorkout()
}

beforeEach(async () => {
  await resetAllData()
  simulateReload()
})

/* ============================================
   A. SET COMPLETION + PERSISTENCE
   ============================================ */

describe('set completion persistence', () => {
  it('persists a completed set so it survives a reload', async () => {
    const ex = makeExercise()
    const program = await seedProgram(makeSession([ex]))

    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])

    await useWorkoutStore.getState().completeSet(workout.exerciseLogs[0].id, {
      setNumber: 1,
      weight: 45,
      reps: 8,
      completedAt: Date.now(),
    })

    // Reload: fresh read straight from IndexedDB
    simulateReload()
    await loadApp()

    const stored = await workoutRepo.getById(workout.id)
    expect(stored?.exerciseLogs[0].setLogs).toHaveLength(1)
    expect(stored?.exerciseLogs[0].setLogs[0].weight).toBe(45)
    expect(stored?.exerciseLogs[0].setLogs[0].reps).toBe(8)
    expect(stored?.exerciseLogs[0].status).toBe('active')
  })

  it('keeps a changed weight as a numeric domain value after reload', async () => {
    const ex = makeExercise()
    const program = await seedProgram(makeSession([ex]))
    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])

    // User edits weight to 82.5 (Italian "82,5" parsed upstream)
    const parsed = parseWeight('82,5')
    expect(parsed).toBe(82.5)

    await useWorkoutStore.getState().completeSet(workout.exerciseLogs[0].id, {
      setNumber: 1,
      weight: parsed,
      reps: 8,
      completedAt: Date.now(),
    })

    simulateReload()
    await loadApp()

    const stored = await workoutRepo.getById(workout.id)
    const w = stored?.exerciseLogs[0].setLogs[0].weight
    expect(w).toBe(82.5)
    expect(typeof w).toBe('number')
    // Display only — never stored as a string with units
    expect(formatWeight(w!)).toBe('82,5 kg')
  })
})

/* ============================================
   B. EXERCISE COMPLETION
   ============================================ */

describe('exercise completion', () => {
  it('marks an exercise completed and persists it across reload', async () => {
    const ex = makeExercise({ sets: 2 })
    const program = await seedProgram(makeSession([ex]))
    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])
    const logId = workout.exerciseLogs[0].id

    await useWorkoutStore.getState().completeSet(logId, {
      setNumber: 1,
      weight: 45,
      reps: 8,
      completedAt: Date.now(),
    })
    await useWorkoutStore.getState().completeSet(logId, {
      setNumber: 2,
      weight: 45,
      reps: 7,
      completedAt: Date.now(),
    })
    // Screen auto-completes the exercise after the last set
    await useWorkoutStore.getState().completeExercise(logId)

    simulateReload()
    await loadApp()

    const stored = await workoutRepo.getById(workout.id)
    expect(stored?.exerciseLogs[0].status).toBe('completed')
    expect(stored?.exerciseLogs[0].setLogs).toHaveLength(2)
    expect(stored?.exerciseLogs[0].completedAt).toBeDefined()
  })
})

/* ============================================
   C. WORKOUT COMPLETION + ACTIVE WORKOUT RECOVERY
   ============================================ */

describe('workout completion', () => {
  it('completes the workout, clears active state, keeps history after reload', async () => {
    const ex = makeExercise()
    const program = await seedProgram(makeSession([ex]))
    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])

    // Active workout is recoverable after reload
    simulateReload()
    await loadApp()
    expect(useWorkoutStore.getState().activeWorkout?.id).toBe(workout.id)

    await useWorkoutStore.getState().completeWorkout()

    simulateReload()
    await loadApp()

    // No stale active workout
    expect(useWorkoutStore.getState().activeWorkout).toBeNull()
    // Workout remains in history
    const completed = await workoutRepo.getCompleted()
    expect(completed.map((w) => w.id)).toContain(workout.id)
    const stored = await workoutRepo.getById(workout.id)
    expect(stored?.status).toBe('completed')
    expect(stored?.completedAt).toBeDefined()
  })

  it('clears a stale activeWorkoutId reference', async () => {
    const ex = makeExercise()
    const program = await seedProgram(makeSession([ex]))
    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])
    // Simulate a stale pointer (e.g. workout deleted)
    await appStateRepo.setActiveWorkout(workout.id)
    await db.workouts.delete(workout.id)

    simulateReload()
    await loadApp()
    expect(useWorkoutStore.getState().activeWorkout).toBeNull()
    const state = await appStateRepo.get()
    expect(state.activeWorkoutId).toBeUndefined()
  })
})

/* ============================================
   D. HISTORY SNAPSHOT ISOLATION
   ============================================ */

describe('history snapshot behavior', () => {
  it('historical workouts are unchanged when the program is edited', async () => {
    const ex = makeExercise({ name: 'Chest Press', defaultWeight: 45 })
    const program = await seedProgram(makeSession([ex]))

    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])
    const logId = workout.exerciseLogs[0].id
    await useWorkoutStore.getState().completeSet(logId, {
      setNumber: 1,
      weight: 45,
      reps: 8,
      completedAt: Date.now(),
    })
    await useWorkoutStore.getState().completeExercise(logId)
    await useWorkoutStore.getState().completeWorkout()

    // User edits the program: rename + change default weight
    const freshProgram = await programRepo.getById(program.id)
    const template = freshProgram!.sessions[0].exercises[0]
    await programRepo.updateExercise(program.id, program.sessions[0].id, {
      ...template,
      name: 'Chest Press Machine',
      defaultWeight: 50,
    })

    // History is untouched
    const stored = await workoutRepo.getById(workout.id)
    expect(stored?.exerciseLogs[0].exerciseNameSnapshot).toBe('Chest Press')
    expect(stored?.exerciseLogs[0].setLogs[0].weight).toBe(45)
    // Template reflects the edit
    const after = await programRepo.getById(program.id)
    expect(after?.sessions[0].exercises[0].name).toBe('Chest Press Machine')
    expect(after?.sessions[0].exercises[0].defaultWeight).toBe(50)
  })

  it('editing an exercise preserves its position in the session', async () => {
    const a = makeExercise({ name: 'A' })
    const b = makeExercise({ name: 'B' })
    const c = makeExercise({ name: 'C' })
    const program = await seedProgram(makeSession([a, b, c]))

    const originalOrder = program.sessions[0].exercises.map((e) => e.name)
    expect(originalOrder).toEqual(['A', 'B', 'C'])

    // Edit the LAST exercise (historically order was reset to 0 → jumped to top)
    await programRepo.updateExercise(program.id, program.sessions[0].id, {
      ...c,
      name: 'C edited',
      order: 0, // callers may pass 0 — repo must preserve position
    })

    const after = await programRepo.getById(program.id)
    const names = [...after!.sessions[0].exercises]
      .sort((x, y) => x.order - y.order)
      .map((e) => e.name)
    expect(names).toEqual(['A', 'B', 'C edited'])
  })
})

/* ============================================
   E. TIMER RELOAD RECOVERY
   ============================================ */

describe('timer reload recovery', () => {
  it('recovers a running timer based on endAt after reload', async () => {
    await useTimerStore.getState().startTimer(90)
    const before = useTimerStore.getState().timer!
    expect(before.status).toBe('running')
    expect(before.endAt - before.startedAt).toBe(90 * 1000)

    simulateReload()
    await loadApp()

    const after = useTimerStore.getState().timer!
    expect(after.status).toBe('running')
    expect(after.endAt).toBe(before.endAt)
    // Remaining time derives from endAt - now, not from decremented state
    const remaining = (after.endAt - Date.now()) / 1000
    expect(remaining).toBeLessThanOrEqual(90)
    expect(remaining).toBeGreaterThan(80)
  })

  it('marks an expired timer as completed on load', async () => {
    await useTimerStore.getState().startTimer(1)
    // Force expiry as if the app was closed for a while
    const t = useTimerStore.getState().timer!
    await appStateRepo.setTimerState({ ...t, endAt: Date.now() - 5000 })

    simulateReload()
    await loadApp()

    expect(useTimerStore.getState().timer?.status).toBe('completed')
  })

  it('extendTimer adds time without shrinking remaining time', async () => {
    await useTimerStore.getState().startTimer(60)
    const before = useTimerStore.getState().timer!.endAt
    await useTimerStore.getState().extendTimer(30)
    const after = useTimerStore.getState().timer!
    expect(after.endAt).toBe(before + 30_000)
    expect(after.durationSeconds).toBe(90)
  })

  it('stopTimer clears persisted state', async () => {
    await useTimerStore.getState().startTimer(60)
    await useTimerStore.getState().stopTimer()
    simulateReload()
    await loadApp()
    expect(useTimerStore.getState().timer).toBeNull()
  })
})

/* ============================================
   F. NEXT SESSION (integration with real history)
   ============================================ */

describe('next session with real workout history', () => {
  it('advances to the next session after completing one', async () => {
    const s1 = makeSession([makeExercise()])
    const s2: SessionTemplate = { ...makeSession([makeExercise()]), name: 'Seduta 2', order: 1 }
    const program = await seedProgram(s1)
    await programRepo.addSession(program.id, s2)

    const fresh = await programRepo.getById(program.id)
    const { getNextSessionId } = await import('@/lib/selectors')

    // No history → first session
    expect(getNextSessionId(fresh!.sessions, [])).toBe(s1.id)

    // Complete a workout on session 1
    await useWorkoutStore
      .getState()
      .startWorkout(program.id, fresh!.sessions[0])
    await useWorkoutStore.getState().completeWorkout()

    const completed = await workoutRepo.getCompleted()
    expect(getNextSessionId(fresh!.sessions, completed)).toBe(s2.id)
  })
})

describe('cardio exercise logging', () => {
  it('snapshots the planned duration onto the exercise log', async () => {
    const cardio = makeExercise({
      name: 'Tapis Roulant',
      type: 'cardio',
      sets: undefined,
      targetReps: undefined,
      defaultWeight: undefined,
      restSeconds: undefined,
      durationSeconds: 1800,
    })
    const program = await seedProgram(makeSession([cardio]))

    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])

    const log = workout.exerciseLogs[0]
    expect(log.exerciseTypeSnapshot).toBe('cardio')
    expect(log.plannedDurationSeconds).toBe(1800)
    // A cardio bout is a single effort, not a strength set count
    expect(log.plannedSetsSnapshot).toBe(1)
  })

  it('persists the completed duration on the set log', async () => {
    const cardio = makeExercise({
      name: 'Bici',
      type: 'cardio',
      sets: undefined,
      durationSeconds: 600,
    })
    const program = await seedProgram(makeSession([cardio]))
    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])

    await useWorkoutStore.getState().completeSet(workout.exerciseLogs[0].id, {
      setNumber: 1,
      weight: 0,
      reps: 0,
      completedAt: Date.now(),
      durationSeconds: 595,
    })

    const stored = await workoutRepo.getById(workout.id)
    expect(stored?.exerciseLogs[0].setLogs[0].durationSeconds).toBe(595)
  })
})

/* ============================================
   G2. BATCHED PREVIOUS-PERFORMANCE LOOKUP
   ============================================ */

describe('getPreviousPerformances (batched, single scan)', () => {
  it('returns the last pre-workout performance for each exercise in one pass', async () => {
    const exA = makeExercise({ name: 'A' })
    const exB = makeExercise({ name: 'B' })
    const program = await seedProgram(makeSession([exA, exB]))

    // First workout: A=40, B=30
    const w1 = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])
    await useWorkoutStore.getState().completeSet(w1.exerciseLogs[0].id, {
      setNumber: 1, weight: 40, reps: 8, completedAt: Date.now(),
    })
    await useWorkoutStore.getState().completeSet(w1.exerciseLogs[1].id, {
      setNumber: 1, weight: 30, reps: 8, completedAt: Date.now(),
    })
    await useWorkoutStore.getState().completeExercise(w1.exerciseLogs[0].id)
    await useWorkoutStore.getState().completeExercise(w1.exerciseLogs[1].id)
    await useWorkoutStore.getState().completeWorkout()

    // Tests run within the same millisecond, so force w1's start clearly
    // earlier than w2's to make the "strictly before" filter deterministic.
    const w1Stored = (await workoutRepo.getById(w1.id))!
    await workoutRepo.update({ ...w1Stored, startedAt: w1Stored.startedAt - 60_000 })

    // Second workout: bump A to 45, B to 35
    const w2 = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])
    await useWorkoutStore.getState().completeSet(w2.exerciseLogs[0].id, {
      setNumber: 1, weight: 45, reps: 8, completedAt: Date.now(),
    })
    await useWorkoutStore.getState().completeSet(w2.exerciseLogs[1].id, {
      setNumber: 1, weight: 35, reps: 8, completedAt: Date.now(),
    })
    await useWorkoutStore.getState().completeExercise(w2.exerciseLogs[0].id)
    await useWorkoutStore.getState().completeExercise(w2.exerciseLogs[1].id)
    await useWorkoutStore.getState().completeWorkout()

    // Ask for the "previous" performance relative to w2's start
    const ids = w2.exerciseLogs.map((l) => l.exerciseTemplateId)
    const prev = await workoutRepo.getPreviousPerformances(ids, w2.startedAt)

    expect(prev.get(exA.id)?.setLogs[0].weight).toBe(40)
    expect(prev.get(exB.id)?.setLogs[0].weight).toBe(30)
  })

  it('excludes the reference workout itself and anything before it', async () => {
    const exA = makeExercise({ name: 'A' })
    const program = await seedProgram(makeSession([exA]))

    const w1 = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])
    await useWorkoutStore.getState().completeSet(w1.exerciseLogs[0].id, {
      setNumber: 1, weight: 40, reps: 8, completedAt: Date.now(),
    })
    await useWorkoutStore.getState().completeExercise(w1.exerciseLogs[0].id)
    await useWorkoutStore.getState().completeWorkout()

    const w2 = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])
    await useWorkoutStore.getState().completeExercise(w2.exerciseLogs[0].id)
    await useWorkoutStore.getState().completeWorkout()

    // Force distinct start times (tests run in the same millisecond) so the
    // "strictly before" filter is deterministic.
    const w1Stored = (await workoutRepo.getById(w1.id))!
    const w1Start = w1Stored.startedAt - 60_000
    await workoutRepo.update({ ...w1Stored, startedAt: w1Start })
    const w2Stored = (await workoutRepo.getById(w2.id))!
    const w2Start = w2Stored.startedAt + 60_000
    await workoutRepo.update({ ...w2Stored, startedAt: w2Start })

    // Relative to w1 (earliest) → nothing precedes it
    const prevForW1 = await workoutRepo.getPreviousPerformances(
      [exA.id],
      w1Start
    )
    expect(prevForW1.has(exA.id)).toBe(false)

    // Relative to w2 → w1 is the previous one (weight 40)
    const prevForW2 = await workoutRepo.getPreviousPerformances(
      [exA.id],
      w2Start
    )
    expect(prevForW2.get(exA.id)?.setLogs[0].weight).toBe(40)
  })
})

/* ============================================
   G. RESET DATA
   ============================================ */

describe('reset data', () => {
  it('returns the database to a clean, seedable state', async () => {
    const ex = makeExercise()
    const program = await seedProgram(makeSession([ex]))
    const workout = await useWorkoutStore
      .getState()
      .startWorkout(program.id, program.sessions[0])
    await useTimerStore.getState().startTimer(60)
    await settingsRepo.update({ defaultRestSeconds: 120 })

    await resetAllData()
    useTimerStore.setState({ timer: null })
    useWorkoutStore.getState().clearActiveWorkout()

    expect(await db.programs.count()).toBe(0)
    expect(await db.workouts.count()).toBe(0)
    expect((await appStateRepo.get()).activeWorkoutId).toBeUndefined()
    expect((await appStateRepo.get()).timerState).toBeUndefined()
    // Settings fall back to defaults
    expect((await settingsRepo.get()).defaultRestSeconds).toBe(90)
    // No dangling references
    expect(await workoutRepo.getById(workout.id)).toBeUndefined()
    simulateReload()
    await loadApp()
    expect(useWorkoutStore.getState().activeWorkout).toBeNull()
    expect(useTimerStore.getState().timer).toBeNull()
  })
})

/* ============================================
   H. ITALIAN WEIGHT FORMATTING (edge cases)
   ============================================ */

describe('Italian weight formatting edge cases', () => {
  it.each([
    [80, '80'],
    [80.5, '80,5'],
    [82.5, '82,5'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatWeightValue(value)).toBe(expected)
    expect(formatWeight(value)).toBe(`${expected} kg`)
  })

  it.each([
    ['80', 80],
    ['80.5', 80.5],
    ['80,5', 80.5],
    ['82.5', 82.5],
    ['82,5', 82.5],
  ])('parses %s as %s', (input, expected) => {
    expect(parseWeight(input)).toBe(expected)
  })
})
