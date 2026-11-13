/* ============================================
   MULTI-TAB SYNC
   BroadcastChannel synchronization across tabs
   ============================================ */

import { useEffect } from 'react';

const CHANNEL_NAME = 'workout-app-tab-sync';

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function notifyTabSync(): void {
  try {
    const ch = getChannel();
    if (ch) {
      ch.postMessage({ type: 'sync', timestamp: Date.now() });
    }
  } catch {
    // Ignore if closed or blocked
  }
}

/**
 * React hook to listen for database changes triggered in other tabs.
 */
export function useTabSync(onSync: () => void): void {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return;
    }

    const ch = new BroadcastChannel(CHANNEL_NAME);
    const handler = (event: MessageEvent) => {
      if (event.data && (event.data as { type?: string }).type === 'sync') {
        onSync();
      }
    };

    ch.addEventListener('message', handler);

    return () => {
      ch.removeEventListener('message', handler);
      ch.close();
    };
  }, [onSync]);
}
