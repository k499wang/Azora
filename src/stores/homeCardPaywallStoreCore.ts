import { create } from 'zustand';
import type { PaywallPackageOption } from '../services/paywall';

const STORAGE_KEY = 'paywall:home_card_pending';

export interface HomeCardPaywallRequest {
  userId: string;
  name: string | null;
  goalPhrase: string | null;
  /** The dev preview: this sample package, no purchase, and no hold on the tour. */
  preview?: { pkg: PaywallPackageOption };
}

interface HomeCardPaywallState {
  request: HomeCardPaywallRequest | null;
  /** False until the saved card is read; the tour waits so it can't start first. */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  show: (request: HomeCardPaywallRequest) => void;
  clear: () => void;
}

interface HomeCardStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

function parseSavedRequest(saved: string | null): HomeCardPaywallRequest | null {
  if (saved == null) return null;
  try {
    const value = JSON.parse(saved);
    return typeof value?.userId === 'string'
      ? { userId: value.userId, name: value.name ?? null, goalPhrase: value.goalPhrase ?? null }
      : null;
  } catch {
    return null;
  }
}

/** Saved until bought, restored, or closed, so quitting can't skip the card. */
export function createHomeCardPaywallStore(storage: HomeCardStorage) {
  return create<HomeCardPaywallState>((set, get) => ({
    request: null,
    hydrated: false,
    hydrate: async () => {
      if (get().hydrated) return;
      let saved: HomeCardPaywallRequest | null = null;
      try {
        saved = parseSavedRequest(await storage.getItem(STORAGE_KEY));
      } catch {
        // Nothing to recover: this launch simply has no saved card.
      }
      // A card shown while the read was pending is newer than the saved one.
      set({ hydrated: true, request: get().request ?? saved });
    },
    show: (request) => {
      set({ request });
      if (request.preview != null) return;
      const { userId, name, goalPhrase } = request;
      storage.setItem(STORAGE_KEY, JSON.stringify({ userId, name, goalPhrase })).catch(() => {});
    },
    clear: () => {
      const wasPreview = get().request?.preview != null;
      set({ request: null });
      if (!wasPreview) storage.removeItem(STORAGE_KEY).catch(() => {});
    },
  }));
}
