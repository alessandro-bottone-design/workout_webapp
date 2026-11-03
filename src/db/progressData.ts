/* ============================================
   HISTORICAL PROGRESS DATA (Screenshots IMG_5468 to IMG_5476)
   Exact match for the 9 completed workouts, metrics and trends
   ============================================ */

import type { Program, Workout, WorkoutExerciseLog, SetLog, AppSettings, AppState } from '@/types';
import { db } from './database';
import { generateId } from '@/lib/ids';

export const USER_EMAIL = 'alessandrobottone2005@gmail.com';
export const USER_NAME = 'Alessandro Bottone';

// Stable UUIDs for Program, Sessions, and Exercises (RFC 4122 valid)
export const PROGRAM_ID = 'a1111111-1111-4111-8111-111111111111';

export const SESSION_IDS = {
  seduta1: 'b1111111-1111-4111-8111-111111111101',
  seduta2: 'b1111111-1111-4111-8111-111111111102',
  seduta3: 'b1111111-1111-4111-8111-111111111103',
  seduta4: 'b1111111-1111-4111-8111-111111111104',
} as const;

export const EXERCISE_IDS = {
  // Seduta 1
  cyclette: 'c1111111-1111-4111-8111-000000000001',
  chestPress: 'c1111111-1111-4111-8111-000000000002',
  panca45: 'c1111111-1111-4111-8111-000000000003',
  latMachine: 'c1111111-1111-4111-8111-000000000004',
  alzateLaterali: 'c1111111-1111-4111-8111-000000000005',
  tapisRoulant1: 'c1111111-1111-4111-8111-000000000006',

  // Seduta 2
  ellittica: 'c1111111-1111-4111-8111-000000000007',
  legExtension: 'c1111111-1111-4111-8111-000000000008',
  legPress: 'c1111111-1111-4111-8111-000000000009',
  reverseFly: 'c1111111-1111-4111-8111-000000000010',
  lentoAvanti: 'c1111111-1111-4111-8111-000000000011',
  tapisRoulant2: 'c1111111-1111-4111-8111-000000000012',

  // Seduta 3
  tapisRiscaldamento: 'c1111111-1111-4111-8111-000000000013',
  legCurl: 'c1111111-1111-4111-8111-000000000014',
  stacchiManubri: 'c1111111-1111-4111-8111-000000000015',
  adductorAbductor: 'c1111111-1111-4111-8111-000000000016',
  russianTwist: 'c1111111-1111-4111-8111-000000000017',
  plank: 'c1111111-1111-4111-8111-000000000018',
  tapisRoulant3: 'c1111111-1111-4111-8111-000000000019',

  // Seduta 4
  rematoreManubrio: 'c1111111-1111-4111-8111-000000000020',
  pullDownAsta: 'c1111111-1111-4111-8111-000000000021',
  curlBilanciereEZ: 'c1111111-1111-4111-8111-000000000022',
  tricipitiCorda: 'c1111111-1111-4111-8111-000000000023',
  tapisRoulant4: 'c1111111-1111-4111-8111-000000000024',
} as const;

export const OFFICIAL_USER_PROGRAM: Program = {
  id: PROGRAM_ID,
  name: 'Scheda Allenamento',
  createdAt: 1729000000000,
  durationWeeks: 8,
  sheetRevision: 2,
  sessions: [
    {
      id: SESSION_IDS.seduta1,
      name: 'Seduta 1',
      order: 0,
      exercises: [
        {
          id: EXERCISE_IDS.cyclette,
          name: 'Cyclette',
          type: 'cardio',
          order: 0,
          durationSeconds: 10 * 60,
          notes: '10 min riscaldamento',
        },
        {
          id: EXERCISE_IDS.chestPress,
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
          id: EXERCISE_IDS.panca45,
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
          id: EXERCISE_IDS.latMachine,
          name: 'Lat Machine Maniglia Singola',
          type: 'strength',
          order: 3,
          sets: 4,
          targetReps: 8,
          defaultWeight: 20.3,
          restSeconds: 120,
        },
        {
          id: EXERCISE_IDS.alzateLaterali,
          name: 'Alzate Laterali Cavo Medio',
          type: 'strength',
          order: 4,
          sets: 3,
          targetReps: 8,
          defaultWeight: 10,
          restSeconds: 120,
        },
        {
          id: EXERCISE_IDS.tapisRoulant1,
          name: 'Tapis Roulant',
          type: 'cardio',
          order: 5,
          durationSeconds: 30 * 60,
          notes: '20 min a velocità 6.2 + 10 min a velocità 4.0 senza inclinazione',
        },
      ],
    },
    {
      id: SESSION_IDS.seduta2,
      name: 'Seduta 2',
      order: 1,
      exercises: [
        {
          id: EXERCISE_IDS.ellittica,
          name: 'Ellittica',
          type: 'cardio',
          order: 0,
          durationSeconds: 6 * 60,
          notes: '6 min riscaldamento',
        },
        {
          id: EXERCISE_IDS.legExtension,
          name: 'Leg Extension',
          type: 'strength',
          order: 1,
          sets: 4,
          targetReps: 8,
          defaultWeight: 59,
          restSeconds: 120,
        },
        {
          id: EXERCISE_IDS.legPress,
          name: 'Leg Press Piedi stretti',
          type: 'strength',
          order: 2,
          sets: 3,
          targetReps: 8,
          defaultWeight: 79,
          restSeconds: 120,
        },
        {
          id: EXERCISE_IDS.reverseFly,
          name: 'Reverse Fly Machine',
          type: 'strength',
          order: 3,
          sets: 3,
          targetReps: 12,
          defaultWeight: 32,
          restSeconds: 120,
        },
        {
          id: EXERCISE_IDS.lentoAvanti,
          name: 'Lento Avanti Manubri',
          type: 'strength',
          order: 4,
          sets: 3,
          targetReps: 8,
          defaultWeight: 16,
          restSeconds: 120,
        },
        {
          id: EXERCISE_IDS.tapisRoulant2,
          name: 'Tapis Roulant',
          type: 'cardio',
          order: 5,
          durationSeconds: 30 * 60,
          notes: '20 min a velocità 6.2 + 10 min a velocità 4.0 senza inclinazione',
        },
      ],
    },
    {
      id: SESSION_IDS.seduta3,
      name: 'Seduta 3',
      order: 2,
      exercises: [
        {
          id: EXERCISE_IDS.tapisRiscaldamento,
          name: 'Tapis Roulant Riscaldamento',
          type: 'cardio',
          order: 0,
          durationSeconds: 10 * 60,
          notes: '10 min riscaldamento',
        },
        {
          id: EXERCISE_IDS.legCurl,
          name: 'Leg Curl Monopodalica',
          type: 'strength',
          order: 1,
          sets: 3,
          targetReps: 8,
          defaultWeight: 32,
          restSeconds: 120,
        },
        {
          id: EXERCISE_IDS.stacchiManubri,
          name: 'Stacchi Manubri (gambe leggermente piegate)',
          type: 'strength',
          order: 2,
          sets: 3,
          targetReps: 8,
          defaultWeight: 18,
          restSeconds: 120,
        },
        {
          id: EXERCISE_IDS.adductorAbductor,
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
          id: EXERCISE_IDS.russianTwist,
          name: 'Russian Twist con Kettlebell',
          type: 'strength',
          order: 4,
          sets: 3,
          targetReps: 12,
          defaultWeight: 8,
          restSeconds: 120,
        },
        {
          id: EXERCISE_IDS.plank,
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
          id: EXERCISE_IDS.tapisRoulant3,
          name: 'Tapis Roulant',
          type: 'cardio',
          order: 6,
          durationSeconds: 30 * 60,
          notes: '20 min a velocità 6.2 + 10 min a velocità 4.0 senza inclinazione',
        },
      ],
    },
    {
      id: SESSION_IDS.seduta4,
      name: 'Seduta 4',
      order: 3,
      exercises: [
        {
          id: EXERCISE_IDS.rematoreManubrio,
          name: 'Rematore Manubrio',
          type: 'strength',
          order: 0,
          sets: 3,
          targetReps: 8,
          defaultWeight: 24,
          restSeconds: 120,
        },
        {
          id: EXERCISE_IDS.pullDownAsta,
          name: 'Pull Down Asta',
          type: 'strength',
          order: 1,
          sets: 3,
          targetReps: 12,
          defaultWeight: 18,
          restSeconds: 120,
        },
        {
          id: EXERCISE_IDS.curlBilanciereEZ,
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
          id: EXERCISE_IDS.tricipitiCorda,
          name: 'Tricipiti Corda',
          type: 'strength',
          order: 3,
          sets: 4,
          targetReps: 8,
          defaultWeight: 14,
          restSeconds: 120,
        },
        {
          id: EXERCISE_IDS.tapisRoulant4,
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

function buildStrengthLog(
  exerciseTemplateId: string,
  exerciseName: string,
  order: number,
  sets: number,
  targetReps: number,
  weight: number,
  startedAt: number
): WorkoutExerciseLog {
  const setLogs: SetLog[] = Array.from({ length: sets }, (_, i) => ({
    id: generateId(),
    setNumber: i + 1,
    weight,
    reps: targetReps,
    completedAt: startedAt + (i + 1) * 120_000,
  }));

  return {
    id: generateId(),
    exerciseTemplateId,
    exerciseNameSnapshot: exerciseName,
    exerciseTypeSnapshot: 'strength',
    plannedSetsSnapshot: sets,
    targetRepsSnapshot: targetReps,
    plannedWeightSnapshot: weight,
    order,
    status: 'completed',
    setLogs,
    startedAt,
    completedAt: startedAt + sets * 120_000,
  };
}

function buildCardioLog(
  exerciseTemplateId: string,
  exerciseName: string,
  order: number,
  durationMinutes: number,
  startedAt: number
): WorkoutExerciseLog {
  return {
    id: generateId(),
    exerciseTemplateId,
    exerciseNameSnapshot: exerciseName,
    exerciseTypeSnapshot: 'cardio',
    plannedSetsSnapshot: 1,
    plannedDurationSeconds: durationMinutes * 60,
    order,
    status: 'completed',
    setLogs: [],
    startedAt,
    completedAt: startedAt + durationMinutes * 60_000,
  };
}

// 91 minutes duration = 5,460,000 ms per workout (matches exactly "1h 31min")
const DURATION_91_MIN = 91 * 60 * 1000;

/**
 * Generates the 9 historical workouts exactly matching all screenshot data:
 * - 9 total completed workouts
 * - Current streak: 1
 * - This week count: 1 (Workout 9 on Tuesday Nov 3, 2026)
 * - Average duration: 1h 31min (all workouts lasting 91m)
 * - Exact representative weights & trends:
 *   - Chest Press: 47.3 kg (stable)
 *   - Panca 45° al multipower: 37.5 kg (stable)
 *   - Lat Machine Maniglia Singola: 20.3 kg (down from 23 kg)
 *   - Alzate Laterali Cavo Medio: 10 kg (stable)
 *   - Leg Extension: 63.6 kg (up from 59 kg)
 *   - Leg Press Piedi stretti: 83.6 kg (stable)
 *   - Reverse Fly Machine: 32 kg (stable)
 *   - Lento Avanti Manubri: 18 kg (up from 16 kg)
 *   - Leg Curl Monopodalica: 34.3 kg (up from 32 kg)
 *   - Stacchi Manubri: 22 kg (up from 18 kg)
 *   - Adductor + Abductor: 36 kg (stable)
 *   - Russian Twist: No logs ("Nessun dato")
 *   - Plank: 0 kg (stable)
 *   - Rematore Manubrio: 26 kg (stable)
 *   - Pull Down Asta: 18 kg (stable)
 *   - Curl Bilanciere EZ Panca Scott: 24.5 kg (up from 20 kg)
 *   - Tricipiti Corda: 23 kg (stable)
 */
export function buildHistoricalWorkouts(): Workout[] {
  // Workout dates:
  // Today is Nov 3, 2026 (Tuesday).
  // W9: Nov 3, 2026, 08:52 - 10:23 (91 min)
  const d9 = new Date(2026, 10, 3, 8, 52, 0).getTime();
  // W8: Oct 30, 2026 (Friday)
  const d8 = new Date(2026, 9, 30, 18, 0, 0).getTime();
  // W7: Oct 28, 2026 (Wednesday)
  const d7 = new Date(2026, 9, 28, 18, 0, 0).getTime();
  // W6: Oct 26, 2026 (Monday)
  const d6 = new Date(2026, 9, 26, 18, 0, 0).getTime();
  // W5: Oct 23, 2026 (Friday)
  const d5 = new Date(2026, 9, 23, 18, 0, 0).getTime();
  // W4: Oct 21, 2026 (Wednesday)
  const d4 = new Date(2026, 9, 21, 18, 0, 0).getTime();
  // W3: Oct 19, 2026 (Monday)
  const d3 = new Date(2026, 9, 19, 18, 0, 0).getTime();
  // W2: Oct 16, 2026 (Friday)
  const d2 = new Date(2026, 9, 16, 18, 0, 0).getTime();
  // W1: Oct 14, 2026 (Wednesday)
  const d1 = new Date(2026, 9, 14, 18, 0, 0).getTime();

  return [
    // W1: Seduta 1 (Baseline)
    {
      id: 'd1111111-1111-4111-8111-000000000001',
      programId: PROGRAM_ID,
      sessionTemplateId: SESSION_IDS.seduta1,
      sessionNameSnapshot: 'Seduta 1',
      startedAt: d1,
      completedAt: d1 + DURATION_91_MIN,
      status: 'completed',
      exerciseLogs: [
        buildCardioLog(EXERCISE_IDS.cyclette, 'Cyclette', 0, 10, d1),
        buildStrengthLog(EXERCISE_IDS.chestPress, 'Chest Press', 1, 3, 8, 47.3, d1 + 600_000),
        buildStrengthLog(EXERCISE_IDS.panca45, 'Panca 45° al multipower', 2, 3, 6, 37.5, d1 + 1200_000),
        buildStrengthLog(EXERCISE_IDS.latMachine, 'Lat Machine Maniglia Singola', 3, 4, 8, 20.3, d1 + 1800_000),
        buildStrengthLog(EXERCISE_IDS.alzateLaterali, 'Alzate Laterali Cavo Medio', 4, 3, 8, 10, d1 + 2400_000),
        buildCardioLog(EXERCISE_IDS.tapisRoulant1, 'Tapis Roulant', 5, 30, d1 + 3000_000),
      ],
    },

    // W2: Seduta 2 (Baseline)
    {
      id: 'd1111111-1111-4111-8111-000000000002',
      programId: PROGRAM_ID,
      sessionTemplateId: SESSION_IDS.seduta2,
      sessionNameSnapshot: 'Seduta 2',
      startedAt: d2,
      completedAt: d2 + DURATION_91_MIN,
      status: 'completed',
      exerciseLogs: [
        buildCardioLog(EXERCISE_IDS.ellittica, 'Ellittica', 0, 6, d2),
        buildStrengthLog(EXERCISE_IDS.legExtension, 'Leg Extension', 1, 4, 8, 59, d2 + 400_000),
        buildStrengthLog(EXERCISE_IDS.legPress, 'Leg Press Piedi stretti', 2, 3, 8, 83.6, d2 + 1000_000),
        buildStrengthLog(EXERCISE_IDS.reverseFly, 'Reverse Fly Machine', 3, 3, 12, 32, d2 + 1600_000),
        buildStrengthLog(EXERCISE_IDS.lentoAvanti, 'Lento Avanti Manubri', 4, 3, 8, 16, d2 + 2200_000),
        buildCardioLog(EXERCISE_IDS.tapisRoulant2, 'Tapis Roulant', 5, 30, d2 + 2800_000),
      ],
    },

    // W3: Seduta 3 (Baseline)
    {
      id: 'd1111111-1111-4111-8111-000000000003',
      programId: PROGRAM_ID,
      sessionTemplateId: SESSION_IDS.seduta3,
      sessionNameSnapshot: 'Seduta 3',
      startedAt: d3,
      completedAt: d3 + DURATION_91_MIN,
      status: 'completed',
      exerciseLogs: [
        buildCardioLog(EXERCISE_IDS.tapisRiscaldamento, 'Tapis Roulant Riscaldamento', 0, 10, d3),
        buildStrengthLog(EXERCISE_IDS.legCurl, 'Leg Curl Monopodalica', 1, 3, 8, 32, d3 + 600_000),
        buildStrengthLog(EXERCISE_IDS.stacchiManubri, 'Stacchi Manubri (gambe leggermente piegate)', 2, 3, 8, 18, d3 + 1200_000),
        buildStrengthLog(EXERCISE_IDS.adductorAbductor, 'Adductor + Abductor (Superserie)', 3, 3, 10, 36, d3 + 1800_000),
        // Russian twist skipped -> "Nessun dato"
        buildStrengthLog(EXERCISE_IDS.plank, 'Plank', 5, 3, 1, 0, d3 + 2400_000),
        buildCardioLog(EXERCISE_IDS.tapisRoulant3, 'Tapis Roulant', 6, 30, d3 + 3000_000),
      ],
    },

    // W4: Seduta 4 (Baseline)
    {
      id: 'd1111111-1111-4111-8111-000000000004',
      programId: PROGRAM_ID,
      sessionTemplateId: SESSION_IDS.seduta4,
      sessionNameSnapshot: 'Seduta 4',
      startedAt: d4,
      completedAt: d4 + DURATION_91_MIN,
      status: 'completed',
      exerciseLogs: [
        buildStrengthLog(EXERCISE_IDS.rematoreManubrio, 'Rematore Manubrio', 0, 3, 8, 26, d4),
        buildStrengthLog(EXERCISE_IDS.pullDownAsta, 'Pull Down Asta', 1, 3, 12, 18, d4 + 600_000),
        buildStrengthLog(EXERCISE_IDS.curlBilanciereEZ, 'Curl Bilanciere EZ Panca Scott', 2, 3, 8, 20, d4 + 1200_000),
        buildStrengthLog(EXERCISE_IDS.tricipitiCorda, 'Tricipiti Corda', 3, 4, 8, 23, d4 + 1800_000),
        buildCardioLog(EXERCISE_IDS.tapisRoulant4, 'Tapis Roulant', 4, 30, d4 + 2400_000),
      ],
    },

    // W5: Seduta 1 (Lat Machine increased to 23 kg before dropping to 20.3 kg)
    {
      id: 'd1111111-1111-4111-8111-000000000005',
      programId: PROGRAM_ID,
      sessionTemplateId: SESSION_IDS.seduta1,
      sessionNameSnapshot: 'Seduta 1',
      startedAt: d5,
      completedAt: d5 + DURATION_91_MIN,
      status: 'completed',
      exerciseLogs: [
        buildCardioLog(EXERCISE_IDS.cyclette, 'Cyclette', 0, 10, d5),
        buildStrengthLog(EXERCISE_IDS.chestPress, 'Chest Press', 1, 3, 8, 47.3, d5 + 600_000),
        buildStrengthLog(EXERCISE_IDS.panca45, 'Panca 45° al multipower', 2, 3, 6, 37.5, d5 + 1200_000),
        buildStrengthLog(EXERCISE_IDS.latMachine, 'Lat Machine Maniglia Singola', 3, 4, 8, 23, d5 + 1800_000), // higher weight for 'down' trend
        buildStrengthLog(EXERCISE_IDS.alzateLaterali, 'Alzate Laterali Cavo Medio', 4, 3, 8, 10, d5 + 2400_000),
        buildCardioLog(EXERCISE_IDS.tapisRoulant1, 'Tapis Roulant', 5, 30, d5 + 3000_000),
      ],
    },

    // W6: Seduta 2 (Progressed: Leg Extension 63.6 kg, Lento Avanti 18 kg)
    {
      id: 'd1111111-1111-4111-8111-000000000006',
      programId: PROGRAM_ID,
      sessionTemplateId: SESSION_IDS.seduta2,
      sessionNameSnapshot: 'Seduta 2',
      startedAt: d6,
      completedAt: d6 + DURATION_91_MIN,
      status: 'completed',
      exerciseLogs: [
        buildCardioLog(EXERCISE_IDS.ellittica, 'Ellittica', 0, 6, d6),
        buildStrengthLog(EXERCISE_IDS.legExtension, 'Leg Extension', 1, 4, 8, 63.6, d6 + 400_000), // up from 59!
        buildStrengthLog(EXERCISE_IDS.legPress, 'Leg Press Piedi stretti', 2, 3, 8, 83.6, d6 + 1000_000), // stable
        buildStrengthLog(EXERCISE_IDS.reverseFly, 'Reverse Fly Machine', 3, 3, 12, 32, d6 + 1600_000), // stable
        buildStrengthLog(EXERCISE_IDS.lentoAvanti, 'Lento Avanti Manubri', 4, 3, 8, 18, d6 + 2200_000), // up from 16!
        buildCardioLog(EXERCISE_IDS.tapisRoulant2, 'Tapis Roulant', 5, 30, d6 + 2800_000),
      ],
    },

    // W7: Seduta 3 (Progressed: Leg Curl 34.3 kg, Stacchi 22 kg)
    {
      id: 'd1111111-1111-4111-8111-000000000007',
      programId: PROGRAM_ID,
      sessionTemplateId: SESSION_IDS.seduta3,
      sessionNameSnapshot: 'Seduta 3',
      startedAt: d7,
      completedAt: d7 + DURATION_91_MIN,
      status: 'completed',
      exerciseLogs: [
        buildCardioLog(EXERCISE_IDS.tapisRiscaldamento, 'Tapis Roulant Riscaldamento', 0, 10, d7),
        buildStrengthLog(EXERCISE_IDS.legCurl, 'Leg Curl Monopodalica', 1, 3, 8, 34.3, d7 + 600_000), // up from 32!
        buildStrengthLog(EXERCISE_IDS.stacchiManubri, 'Stacchi Manubri (gambe leggermente piegate)', 2, 3, 8, 22, d7 + 1200_000), // up from 18!
        buildStrengthLog(EXERCISE_IDS.adductorAbductor, 'Adductor + Abductor (Superserie)', 3, 3, 10, 36, d7 + 1800_000), // stable
        // Russian twist skipped -> "Nessun dato"
        buildStrengthLog(EXERCISE_IDS.plank, 'Plank', 5, 3, 1, 0, d7 + 2400_000), // stable
        buildCardioLog(EXERCISE_IDS.tapisRoulant3, 'Tapis Roulant', 6, 30, d7 + 3000_000),
      ],
    },

    // W8: Seduta 4 (Progressed: Curl Bilanciere EZ 24.5 kg)
    {
      id: 'd1111111-1111-4111-8111-000000000008',
      programId: PROGRAM_ID,
      sessionTemplateId: SESSION_IDS.seduta4,
      sessionNameSnapshot: 'Seduta 4',
      startedAt: d8,
      completedAt: d8 + DURATION_91_MIN,
      status: 'completed',
      exerciseLogs: [
        buildStrengthLog(EXERCISE_IDS.rematoreManubrio, 'Rematore Manubrio', 0, 3, 8, 26, d8), // stable
        buildStrengthLog(EXERCISE_IDS.pullDownAsta, 'Pull Down Asta', 1, 3, 12, 18, d8 + 600_000), // stable
        buildStrengthLog(EXERCISE_IDS.curlBilanciereEZ, 'Curl Bilanciere EZ Panca Scott', 2, 3, 8, 24.5, d8 + 1200_000), // up from 20!
        buildStrengthLog(EXERCISE_IDS.tricipitiCorda, 'Tricipiti Corda', 3, 4, 8, 23, d8 + 1800_000), // stable
        buildCardioLog(EXERCISE_IDS.tapisRoulant4, 'Tapis Roulant', 4, 30, d8 + 2400_000),
      ],
    },

    // W9: Seduta 1 (Most recent, today Nov 3, 2026: Lat Machine down to 20.3 kg)
    {
      id: 'd1111111-1111-4111-8111-000000000009',
      programId: PROGRAM_ID,
      sessionTemplateId: SESSION_IDS.seduta1,
      sessionNameSnapshot: 'Seduta 1',
      startedAt: d9,
      completedAt: d9 + DURATION_91_MIN,
      status: 'completed',
      exerciseLogs: [
        buildCardioLog(EXERCISE_IDS.cyclette, 'Cyclette', 0, 10, d9),
        buildStrengthLog(EXERCISE_IDS.chestPress, 'Chest Press', 1, 3, 8, 47.3, d9 + 600_000), // stable
        buildStrengthLog(EXERCISE_IDS.panca45, 'Panca 45° al multipower', 2, 3, 6, 37.5, d9 + 1200_000), // stable
        buildStrengthLog(EXERCISE_IDS.latMachine, 'Lat Machine Maniglia Singola', 3, 4, 8, 20.3, d9 + 1800_000), // down from 23!
        buildStrengthLog(EXERCISE_IDS.alzateLaterali, 'Alzate Laterali Cavo Medio', 4, 3, 8, 10, d9 + 2400_000), // stable
        buildCardioLog(EXERCISE_IDS.tapisRoulant1, 'Tapis Roulant', 5, 30, d9 + 3000_000),
      ],
    },
  ];
}

/**
 * Seeds the historical progress data into the database.
 * If force is true, clears and inserts the official program and workouts.
 */
export async function seedProgressData(force = false): Promise<void> {
  const existingWorkouts = await db.workouts.count();
  if (existingWorkouts > 0 && !force) {
    return;
  }

  const workouts = buildHistoricalWorkouts();
  const program = OFFICIAL_USER_PROGRAM;

  const defaultSettings: AppSettings & { id: string } = {
    id: 'default',
    defaultRestSeconds: 120,
    soundEnabled: true,
    vibrationEnabled: true,
    weeklyTarget: 4,
  };

  const defaultAppState: AppState = {
    id: 'default',
    activeWorkoutId: undefined,
    timerState: undefined,
  };

  await db.transaction('rw', [db.programs, db.workouts, db.settings, db.appState], async () => {
    if (force) {
      await db.programs.clear();
      await db.workouts.clear();
      await db.settings.clear();
      await db.appState.clear();
    }
    await db.programs.put(program);
    await db.workouts.bulkPut(workouts);
    await db.settings.put(defaultSettings);
    await db.appState.put(defaultAppState);
  });
}
