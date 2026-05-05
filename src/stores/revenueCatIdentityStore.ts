import { create } from 'zustand';

export type RevenueCatIdentityStatus =
  | 'idle'
  | 'syncing'
  | 'synced'
  | 'signed_out'
  | 'unavailable'
  | 'failed';

interface RevenueCatIdentityState {
  status: RevenueCatIdentityStatus;
  appUserId: string | null;
  lastErrorMessage: string | null;
  lastUnavailableReason: string | null;
  lastAttemptedAt: string | null;
  lastSyncedAt: string | null;
  setSyncing: (appUserId: string) => void;
  setSynced: (appUserId: string) => void;
  setSignedOut: () => void;
  setUnavailable: (reason: string) => void;
  setFailed: (error: unknown, appUserId?: string | null) => void;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const useRevenueCatIdentityStore = create<RevenueCatIdentityState>((set) => ({
  status: 'idle',
  appUserId: null,
  lastErrorMessage: null,
  lastUnavailableReason: null,
  lastAttemptedAt: null,
  lastSyncedAt: null,
  setSyncing: (appUserId) => {
    set({
      status: 'syncing',
      appUserId,
      lastErrorMessage: null,
      lastUnavailableReason: null,
      lastAttemptedAt: new Date().toISOString(),
    });
  },
  setSynced: (appUserId) => {
    const now = new Date().toISOString();
    set({
      status: 'synced',
      appUserId,
      lastErrorMessage: null,
      lastUnavailableReason: null,
      lastAttemptedAt: now,
      lastSyncedAt: now,
    });
  },
  setSignedOut: () => {
    set({
      status: 'signed_out',
      appUserId: null,
      lastErrorMessage: null,
      lastUnavailableReason: null,
      lastAttemptedAt: new Date().toISOString(),
    });
  },
  setUnavailable: (reason) => {
    set({
      status: 'unavailable',
      appUserId: null,
      lastErrorMessage: null,
      lastUnavailableReason: reason,
      lastAttemptedAt: new Date().toISOString(),
    });
  },
  setFailed: (error, appUserId = null) => {
    set({
      status: 'failed',
      appUserId,
      lastErrorMessage: toErrorMessage(error),
      lastUnavailableReason: null,
      lastAttemptedAt: new Date().toISOString(),
    });
  },
}));
