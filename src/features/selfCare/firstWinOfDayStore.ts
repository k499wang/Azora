import { create } from 'zustand';

/**
 * The day's first win earns the streak popup once, whichever screen it came
 * from. A win is a to-do, the check-in or the lesson; a breathing exercise has
 * its own result screen and is not one.
 *
 * The claim is taken before the write it rewards, so two quick wins cannot both
 * see an empty day, and handed back if that write fails.
 */
interface FirstWinOfDayState {
  /** `userId:localDate` of the day whose first win has been claimed */
  claimedDay: string | null;
  /** the popup is waiting for Home or Routine to be on screen */
  showing: boolean;
  /**
   * The screen that earned it is still on top, or still closing. The popup
   * lands once that screen is gone rather than over its exit.
   */
  heldForClose: boolean;
  /** dev only: the next win claims the popup whatever today already holds */
  forced: boolean;
  claim: (day: string) => boolean;
  release: (day: string) => void;
  show: (options?: { heldForClose: boolean }) => void;
  /** the screen that earned the popup has finished closing */
  revealAfterClose: () => void;
  dismiss: () => void;
  forceNext: () => void;
}

export const useFirstWinOfDayStore = create<FirstWinOfDayState>((set, get) => ({
  claimedDay: null,
  showing: false,
  heldForClose: false,
  forced: false,
  claim: (day) => {
    if (get().claimedDay === day && !get().forced) return false;
    set({ claimedDay: day, forced: false });
    return true;
  },
  release: (day) => {
    if (get().claimedDay === day) set({ claimedDay: null });
  },
  show: (options) =>
    set({ showing: true, heldForClose: options?.heldForClose ?? false }),
  revealAfterClose: () => set({ heldForClose: false }),
  dismiss: () => set({ showing: false, heldForClose: false }),
  forceNext: () => set({ forced: true }),
}));
