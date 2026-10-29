import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'paywall:last_seen_at_v1';

// When a paywall was last on screen; anchors the paywall nudge notifications.
interface PaywallSeenState {
  lastSeenAt: string | null;
  markSeen: () => void;
}

export const usePaywallSeenStore = create<PaywallSeenState>((set) => ({
  lastSeenAt: null,
  markSeen: () => {
    const lastSeenAt = new Date().toISOString();
    set({ lastSeenAt });
    void AsyncStorage.setItem(STORAGE_KEY, lastSeenAt).catch(() => {});
  },
}));

void AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => {
    if (stored != null && usePaywallSeenStore.getState().lastSeenAt == null) {
      usePaywallSeenStore.setState({ lastSeenAt: stored });
    }
  })
  .catch(() => {});
