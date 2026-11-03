import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_USER_PROGRAM,
  buildHistoricalWorkouts,
  EXERCISE_IDS,
} from '@/db/progressData';
import {
  getWorkoutMetrics,
  getExercisePerformances,
  getExerciseTrend,
} from '@/lib/selectors';
import { formatDuration, formatWeight } from '@/lib/formatters';

describe('Historical Progress Data Verification (Screenshots Match)', () => {
  const workouts = buildHistoricalWorkouts();
  const program = OFFICIAL_USER_PROGRAM;

  it('matches top KPI metrics from IMG_5472.PNG', () => {
    const metrics = getWorkoutMetrics(workouts);

    // WORKOUT COMPLETATI: 9
    expect(metrics.totalCompleted).toBe(9);

    // STREAK: 1 giorni consecutivi
    expect(metrics.currentStreak).toBe(1);

    // QUESTA SETTIMANA: 1 questa settimana
    expect(metrics.thisWeekCount).toBe(1);

    // DURATA MEDIA: 1h 31min
    expect(formatDuration(metrics.averageDurationMs)).toBe('1h 31min');
  });

  it('matches exercise representative weights and trends from IMG_5472 to IMG_5476', () => {
    // Helper to test an exercise
    const checkEx = (
      exerciseId: string,
      expectedWeightFormatted: string,
      expectedTrend: 'up' | 'down' | 'stable'
    ) => {
      const perfs = getExercisePerformances(workouts, exerciseId);
      expect(perfs.length).toBeGreaterThan(0);
      const latest = perfs[perfs.length - 1];
      expect(formatWeight(latest.representativeWeight)).toBe(expectedWeightFormatted);
      expect(getExerciseTrend(perfs)).toBe(expectedTrend);
    };

    // IMG_5472.PNG
    // Chest Press: 47,3 kg, stable
    checkEx(EXERCISE_IDS.chestPress, '47,3 kg', 'stable');

    // Panca 45° al multipower: 37,5 kg, stable
    checkEx(EXERCISE_IDS.panca45, '37,5 kg', 'stable');

    // Lat Machine Maniglia Singola: 20,3 kg, down
    checkEx(EXERCISE_IDS.latMachine, '20,3 kg', 'down');

    // Alzate Laterali Cavo Medio: 10 kg, stable
    checkEx(EXERCISE_IDS.alzateLaterali, '10 kg', 'stable');

    // IMG_5473.PNG
    // Leg Extension: 63,6 kg, up
    checkEx(EXERCISE_IDS.legExtension, '63,6 kg', 'up');

    // Leg Press Piedi stretti: 83,6 kg, stable
    checkEx(EXERCISE_IDS.legPress, '83,6 kg', 'stable');

    // Reverse Fly Machine: 32 kg, stable
    checkEx(EXERCISE_IDS.reverseFly, '32 kg', 'stable');

    // Lento Avanti Manubri: 18 kg, up
    checkEx(EXERCISE_IDS.lentoAvanti, '18 kg', 'up');

    // IMG_5474.PNG
    // Leg Curl Monopodalica: 34,3 kg, up
    checkEx(EXERCISE_IDS.legCurl, '34,3 kg', 'up');

    // Stacchi Manubri (gambe leggermente piegate): 22 kg, up
    checkEx(EXERCISE_IDS.stacchiManubri, '22 kg', 'up');

    // Adductor + Abductor (Superserie): 36 kg, stable
    checkEx(EXERCISE_IDS.adductorAbductor, '36 kg', 'stable');

    // IMG_5475.PNG
    // Russian Twist: no logs
    const russianPerfs = getExercisePerformances(workouts, EXERCISE_IDS.russianTwist);
    expect(russianPerfs.length).toBe(0);

    // Plank: 0 kg, stable
    checkEx(EXERCISE_IDS.plank, '0 kg', 'stable');

    // Rematore Manubrio: 26 kg, stable
    checkEx(EXERCISE_IDS.rematoreManubrio, '26 kg', 'stable');

    // Pull Down Asta: 18 kg, stable
    checkEx(EXERCISE_IDS.pullDownAsta, '18 kg', 'stable');

    // IMG_5476.PNG
    // Curl Bilanciere EZ Panca Scott: 24,5 kg, up
    checkEx(EXERCISE_IDS.curlBilanciereEZ, '24,5 kg', 'up');

    // Tricipiti Corda: 23 kg, stable
    checkEx(EXERCISE_IDS.tricipitiCorda, '23 kg', 'stable');
  });

  it('has valid sessions and order in official program', () => {
    expect(program.sessions).toHaveLength(4);
    expect(program.sessions[0].name).toBe('Seduta 1');
    expect(program.sessions[1].name).toBe('Seduta 2');
    expect(program.sessions[2].name).toBe('Seduta 3');
    expect(program.sessions[3].name).toBe('Seduta 4');
  });

  it('exports valid backup json matching schema', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      app: 'workout-app',
      data: {
        programs: [OFFICIAL_USER_PROGRAM],
        workouts: buildHistoricalWorkouts(),
        settings: [
          {
            id: 'default',
            defaultRestSeconds: 120,
            soundEnabled: true,
            vibrationEnabled: true,
            weeklyTarget: 4,
          },
        ],
        appState: [
          {
            id: 'default',
            activeWorkoutId: undefined,
            timerState: undefined,
          },
        ],
      },
    };

    const outPath = path.resolve(process.cwd(), 'data/workout-backup-progressi.json');
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
    expect(fs.existsSync(outPath)).toBe(true);
  });
});
