import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@shared/db/database';
import { useGoogleCalendarStore } from '@features/calendar/googleCalendarStore';

const mockUpsert = vi.fn();
const mockFrom = vi.fn();
const mockIsConfigured = vi.fn(() => false);

vi.mock('@features/sync/supabase', () => ({
  isSupabaseConfigured: () => mockIsConfigured(),
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { syncAll, getSyncStatus, subscribeSyncStatus } from '@features/sync/sync';

describe('sync engine', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    mockUpsert.mockReset();
    mockFrom.mockReset();
    mockIsConfigured.mockReturnValue(false);
    await db.programs.clear();
    await db.workouts.clear();
    await db.settings.clear();
    useGoogleCalendarStore.getState().disconnect();
  });

  it('returns success gracefully when running unconfigured / offline', async () => {
    const res = await syncAll();
    expect(res.success).toBe(true);
    expect(getSyncStatus().isSyncing).toBe(false);
  });

  it('notifies subscribers of sync status changes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSyncStatus(listener);

    expect(listener).toHaveBeenCalled();
    const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
    expect(lastCall).toHaveProperty('isSyncing');

    unsubscribe();
  });

  it('pushes local googleIcalUrl to user_settings when present locally', async () => {
    const localUrl = 'https://calendar.google.com/calendar/ical/local%40gmail.com/private-111/basic.ics';
    await db.settings.put({
      id: 'default',
      defaultRestSeconds: 120,
      soundEnabled: true,
      vibrationEnabled: true,
      weeklyTarget: 4,
      googleIcalUrl: localUrl,
    });

    mockIsConfigured.mockReturnValue(true);
    mockUpsert.mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_settings') {
        return {
          upsert: mockUpsert,
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  default_rest_seconds: 120,
                  sound_enabled: true,
                  vibration_enabled: true,
                  weekly_target: 4,
                  google_ical_url: localUrl,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: async () => ({ data: [], error: null }),
        }),
      };
    });

    const res = await syncAll('user-123');
    expect(res.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert.mock.calls[0][0]).toMatchObject({
      user_id: 'user-123',
      google_ical_url: localUrl,
    });
  });

  it('restores cloud google_ical_url when local is empty and triggers calendar refresh', async () => {
    const cloudUrl = 'https://calendar.google.com/calendar/ical/cloud%40gmail.com/private-222/basic.ics';
    await db.settings.put({
      id: 'default',
      defaultRestSeconds: 120,
      soundEnabled: true,
      vibrationEnabled: true,
      weeklyTarget: 4,
    });

    const restoreSpy = vi
      .spyOn(useGoogleCalendarStore.getState(), 'restoreUserIcalUrl')
      .mockResolvedValue();

    mockIsConfigured.mockReturnValue(true);
    mockUpsert.mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_settings') {
        return {
          upsert: mockUpsert,
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  default_rest_seconds: 90,
                  sound_enabled: false,
                  vibration_enabled: true,
                  weekly_target: 5,
                  google_ical_url: cloudUrl,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: async () => ({ data: [], error: null }),
        }),
      };
    });

    const res = await syncAll('user-123');
    expect(res.success).toBe(true);

    // Push must NOT overwrite cloud google_ical_url with null when local is empty
    expect(mockUpsert.mock.calls[0][0]).not.toHaveProperty('google_ical_url');

    // Pull must restore googleIcalUrl into IndexedDB settings and call restoreUserIcalUrl
    const updatedSettings = await db.settings.get('default');
    expect(updatedSettings?.googleIcalUrl).toBe(cloudUrl);
    expect(updatedSettings?.defaultRestSeconds).toBe(90);
    expect(restoreSpy).toHaveBeenCalledWith(cloudUrl);
  });
});
