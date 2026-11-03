import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/database';
import { createBackupPayload, importBackupData } from '@/lib/backup';
import type { Program, Workout } from '@/types';

describe('Backup & Restore', () => {
  beforeEach(async () => {
    await db.programs.clear();
    await db.workouts.clear();
    await db.settings.clear();
    await db.appState.clear();
  });

  it('creates a valid backup payload from IndexedDB', async () => {
    const mockProg: Program = {
      id: 'prog-1',
      name: 'Scheda Test',
      createdAt: 1000,
      durationWeeks: 6,
      sessions: [],
    };
    await db.programs.add(mockProg);

    const payload = await createBackupPayload();
    expect(payload.schemaVersion).toBe(1);
    expect(payload.app).toBe('workout-app');
    expect(payload.data.programs).toHaveLength(1);
    expect(payload.data.programs[0].name).toBe('Scheda Test');
  });

  it('imports valid JSON backup and replaces DB contents', async () => {
    const backupJson = JSON.stringify({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      app: 'workout-app',
      data: {
        programs: [
          {
            id: 'imported-p1',
            name: 'Scheda Importata',
            createdAt: 2000,
            durationWeeks: 8,
            sessions: [],
          },
        ],
        workouts: [
          {
            id: 'imported-w1',
            programId: 'imported-p1',
            sessionTemplateId: 's1',
            sessionNameSnapshot: 'Seduta 1',
            startedAt: 5000,
            completedAt: 8000,
            status: 'completed',
            exerciseLogs: [],
          } satisfies Workout,
        ],
        settings: [{ id: 'default', defaultRestSeconds: 150, soundEnabled: false, vibrationEnabled: false }],
        appState: [{ id: 'default' }],
      },
    });

    const res = await importBackupData(backupJson);
    expect(res.programCount).toBe(1);
    expect(res.workoutCount).toBe(1);

    const programs = await db.programs.toArray();
    expect(programs).toHaveLength(1);
    expect(programs[0].id).toBe('imported-p1');

    const workouts = await db.workouts.toArray();
    expect(workouts).toHaveLength(1);
    expect(workouts[0].sessionNameSnapshot).toBe('Seduta 1');

    const settings = await db.settings.get('default');
    expect(settings?.defaultRestSeconds).toBe(150);
  });

  it('rejects invalid JSON string', async () => {
    await expect(importBackupData('invalid-json-content')).rejects.toThrow(
      'Il file selezionato non è un JSON valido.'
    );
  });

  it('rejects backup with no programs and no workouts', async () => {
    const emptyBackup = JSON.stringify({
      schemaVersion: 1,
      data: {
        programs: [],
        workouts: [],
      },
    });
    await expect(importBackupData(emptyBackup)).rejects.toThrow(
      'Il file di backup non contiene schede né allenamenti validi.'
    );
  });
});
