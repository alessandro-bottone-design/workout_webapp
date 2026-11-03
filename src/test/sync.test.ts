import { describe, it, expect, vi } from 'vitest';
import { syncAll, getSyncStatus, subscribeSyncStatus } from '@/lib/sync';

describe('sync engine', () => {
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
});
