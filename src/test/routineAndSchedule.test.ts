import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/database';
import { getGymStatus } from '@/lib/gymSchedule';
import { seedDatabase, buildDefaultProgram, CURRENT_SHEET_REVISION, restoreDefaultProgram } from '@/db/seed';
import { programRepo, resetAllData } from '@/db/repositories';
import { generateId } from '@/lib/ids';
import type { Program } from '@/types';

describe('Gym Schedule Status', () => {
  it('identifies Monday at 10:30 as OPEN until 22:30', () => {
    // 2026-10-12 was a Monday
    const date = new Date(2026, 9, 12, 10, 30);
    const status = getGymStatus(date);
    expect(status.isOpen).toBe(true);
    expect(status.detailText).toContain('22:30');
  });

  it('identifies Monday at 06:15 as CLOSED opening at 07:00', () => {
    const date = new Date(2026, 9, 12, 6, 15);
    const status = getGymStatus(date);
    expect(status.isOpen).toBe(false);
    expect(status.detailText).toContain('07:00');
  });

  it('identifies Monday at 23:00 as CLOSED reopening tomorrow', () => {
    const date = new Date(2026, 9, 12, 23, 0);
    const status = getGymStatus(date);
    expect(status.isOpen).toBe(false);
    expect(status.detailText).toContain('domani');
  });

  it('identifies Saturday at 14:00 as OPEN until 18:00', () => {
    // 2026-10-17 is a Saturday
    const date = new Date(2026, 9, 17, 14, 0);
    const status = getGymStatus(date);
    expect(status.isOpen).toBe(true);
    expect(status.detailText).toContain('18:00');
  });

  it('identifies Saturday at 19:00 as CLOSED reopening Sunday at 09:00', () => {
    const date = new Date(2026, 9, 17, 19, 0);
    const status = getGymStatus(date);
    expect(status.isOpen).toBe(false);
    expect(status.detailText).toContain('09:00');
  });

  it('identifies Sunday at 10:00 as OPEN until 12:00', () => {
    // 2026-10-18 is a Sunday
    const date = new Date(2026, 9, 18, 10, 0);
    const status = getGymStatus(date);
    expect(status.isOpen).toBe(true);
    expect(status.detailText).toContain('12:00');
  });

  it('identifies Sunday at 13:00 as CLOSED reopening Monday at 07:00', () => {
    const date = new Date(2026, 9, 18, 13, 0);
    const status = getGymStatus(date);
    expect(status.isOpen).toBe(false);
    expect(status.detailText).toContain('07:00');
  });
});

describe('New Workout Routine V2 and Migration', () => {
  beforeEach(async () => {
    await resetAllData();
  });

  it('builds the default program with exactly 4 sessions and correct exercise configurations', () => {
    const program = buildDefaultProgram();
    expect(program.name).toBe('Scheda Allenamento');
    expect(program.sheetRevision).toBe(CURRENT_SHEET_REVISION);
    expect(program.sessions).toHaveLength(4);

    // Seduta 1
    const s1 = program.sessions[0];
    expect(s1.name).toBe('Seduta 1');
    expect(s1.exercises).toHaveLength(6);
    expect(s1.exercises[0].name).toBe('Cyclette');
    expect(s1.exercises[0].durationSeconds).toBe(600);
    expect(s1.exercises[1].name).toBe('Chest Press');
    expect(s1.exercises[1].defaultWeight).toBe(52);
    expect(s1.exercises[1].notes).toContain('Drop set');
    expect(s1.exercises[2].name).toBe('Panca 45° al multipower');
    expect(s1.exercises[2].defaultWeight).toBe(35);
    expect(s1.exercises[2].targetReps).toBe(6);
    expect(s1.exercises[3].name).toBe('Lat Machine Maniglia Singola');
    expect(s1.exercises[3].defaultWeight).toBe(20.3);
    expect(s1.exercises[4].name).toBe('Alzate Laterali Cavo Medio');
    expect(s1.exercises[4].defaultWeight).toBe(10);
    expect(s1.exercises[5].name).toBe('Tapis Roulant');
    expect(s1.exercises[5].durationSeconds).toBe(1800);
    expect(s1.exercises[5].notes).toContain('6.2');

    // Seduta 2
    const s2 = program.sessions[1];
    expect(s2.name).toBe('Seduta 2');
    expect(s2.exercises).toHaveLength(6);
    expect(s2.exercises[0].name).toBe('Ellittica');
    expect(s2.exercises[0].durationSeconds).toBe(360);
    expect(s2.exercises[1].name).toBe('Leg Extension');
    expect(s2.exercises[1].defaultWeight).toBe(59);
    expect(s2.exercises[2].name).toBe('Leg Press Piedi stretti');
    expect(s2.exercises[2].defaultWeight).toBe(79);
    expect(s2.exercises[3].name).toBe('Reverse Fly Machine');
    expect(s2.exercises[3].defaultWeight).toBe(32);
    expect(s2.exercises[4].name).toBe('Lento Avanti Manubri');
    expect(s2.exercises[4].defaultWeight).toBe(16);
    expect(s2.exercises[5].name).toBe('Tapis Roulant');
    expect(s2.exercises[5].durationSeconds).toBe(1800);

    // Seduta 3
    const s3 = program.sessions[2];
    expect(s3.name).toBe('Seduta 3');
    expect(s3.exercises).toHaveLength(7);
    expect(s3.exercises[0].name).toBe('Tapis Roulant Riscaldamento');
    expect(s3.exercises[0].durationSeconds).toBe(600);
    expect(s3.exercises[1].name).toBe('Leg Curl Monopodalica');
    expect(s3.exercises[1].defaultWeight).toBe(32);
    expect(s3.exercises[2].name).toBe('Stacchi Manubri (gambe leggermente piegate)');
    expect(s3.exercises[2].defaultWeight).toBe(18);
    expect(s3.exercises[3].name).toBe('Adductor + Abductor (Superserie)');
    expect(s3.exercises[3].defaultWeight).toBe(36);
    expect(s3.exercises[4].name).toBe('Russian Twist con Kettlebell');
    expect(s3.exercises[4].defaultWeight).toBe(8);
    expect(s3.exercises[5].name).toBe('Plank');
    expect(s3.exercises[5].restSeconds).toBe(60);
    expect(s3.exercises[6].name).toBe('Tapis Roulant');
    expect(s3.exercises[6].durationSeconds).toBe(1800);

    // Seduta 4
    const s4 = program.sessions[3];
    expect(s4.name).toBe('Seduta 4');
    expect(s4.exercises).toHaveLength(5);
    expect(s4.exercises[0].name).toBe('Rematore Manubrio');
    expect(s4.exercises[0].defaultWeight).toBe(24);
    expect(s4.exercises[1].name).toBe('Pull Down Asta');
    expect(s4.exercises[1].defaultWeight).toBe(18);
    expect(s4.exercises[2].name).toBe('Curl Bilanciere EZ Panca Scott');
    expect(s4.exercises[2].defaultWeight).toBe(20);
    expect(s4.exercises[3].name).toBe('Tricipiti Corda');
    expect(s4.exercises[3].defaultWeight).toBe(14);
    expect(s4.exercises[4].name).toBe('Tapis Roulant');
    expect(s4.exercises[4].durationSeconds).toBe(1800);
    // Ensure Crunch Inversi su Panca is deleted
    expect(s4.exercises.some((e) => e.name.toLowerCase().includes('crunch'))).toBe(false);
  });

  it('migrates older program without sheetRevision to V2 while keeping ID and without deleting workouts', async () => {
    // Setup older program
    const oldProgramId = generateId();
    const oldProgram: Program = {
      id: oldProgramId,
      name: 'Vecchia Scheda',
      createdAt: Date.now() - 100000,
      durationWeeks: 8,
      sessions: [
        {
          id: generateId(),
          name: 'Vecchia Seduta',
          order: 0,
          exercises: [],
        },
      ],
    };
    await db.programs.add(oldProgram);

    // Run seedDatabase
    await seedDatabase();

    const updated = await programRepo.getFirst();
    expect(updated).toBeDefined();
    expect(updated?.id).toBe(oldProgramId);
    expect(updated?.sheetRevision).toBe(2);
    expect(updated?.sessions).toHaveLength(4);
    expect(updated?.sessions[0].name).toBe('Seduta 1');
  });

  it('restores default program on demand', async () => {
    await seedDatabase();
    const program = await programRepo.getFirst();
    expect(program).toBeDefined();

    // Modify a session
    if (program) {
      program.sessions[0].name = 'Seduta Modificata';
      await programRepo.update(program);
    }

    // Now restore
    await restoreDefaultProgram();
    const restored = await programRepo.getFirst();
    expect(restored?.sessions[0].name).toBe('Seduta 1');
  });
});
