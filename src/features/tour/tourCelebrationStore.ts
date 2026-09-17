import { create } from 'zustand';

/**
 * Outlasts the longest confetti piece in `ConfettiFall` — its slowest fall is
 * a 400ms delay plus 5200ms of travel.
 */
export const TOUR_CELEBRATION_MS = 5800;

interface TourCelebrationState {
  celebrating: boolean;
  /** the whole run reached its last stop and the app is the user's again */
  celebrate: () => void;
  clear: () => void;
}

export const useTourCelebrationStore = create<TourCelebrationState>((set) => ({
  celebrating: false,
  celebrate: () => set({ celebrating: true }),
  clear: () => set({ celebrating: false }),
}));
