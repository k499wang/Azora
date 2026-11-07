import { create } from 'zustand';
import type { PaywallPackageOption } from '../services/paywall';

export interface HomeCardPaywallRequest {
  userId: string;
  name: string | null;
  goalPhrase: string | null;
  /** The dev preview: this sample package, no purchase, and no hold on the tour. */
  preview?: { pkg: PaywallPackageOption };
}

interface HomeCardPaywallState {
  request: HomeCardPaywallRequest | null;
  show: (request: HomeCardPaywallRequest) => void;
  clear: () => void;
}

/** Held in memory: after a relaunch, a non-Pro user meets the normal boot paywall. */
export const useHomeCardPaywallStore = create<HomeCardPaywallState>((set) => ({
  request: null,
  show: (request) => set({ request }),
  clear: () => set({ request: null }),
}));
