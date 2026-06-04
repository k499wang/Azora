import { create } from 'zustand';

// Signals that the post-onboarding exit-intent discount should be presented over
// Home once the main app renders. Set when the onboarding paywall is dismissed
// without a purchase; cleared once the offer has been presented.
interface ExitOfferState {
  pending: boolean;
  setPending: (pending: boolean) => void;
}

export const useExitOfferStore = create<ExitOfferState>((set) => ({
  pending: false,
  setPending: (pending) => set({ pending }),
}));
