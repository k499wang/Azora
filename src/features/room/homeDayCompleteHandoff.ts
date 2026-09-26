import { create } from 'zustand';

/**
 * A finished day handed to Home to celebrate.
 *
 * A lesson or check-in that finishes the day closes straight onto Home and
 * hands the moment over, so the celebration ends on the room it decorates
 * rather than on a screen that then has to leave. An exercise the check-in
 * offered, quit before its result could celebrate, does the same once its
 * close has finished: `waiting` while it goes, `ready` once it has.
 */
interface HomeDayCompleteHandoffState {
  stage: 'idle' | 'waiting' | 'ready';
  /** the unit just finished, counted done while its write lands */
  unitId: string | null;
}

export const useHomeDayCompleteHandoff = create<HomeDayCompleteHandoffState>(
  () => ({ stage: 'idle', unitId: null }),
);

export function handDayCompleteToHome(unitId: string): void {
  useHomeDayCompleteHandoff.setState({ stage: 'ready', unitId });
}

export function holdDayCompleteForHome(): void {
  useHomeDayCompleteHandoff.setState({ stage: 'waiting', unitId: null });
}

/** The screen that held it has finished closing. */
export function releaseDayCompleteForHome(): void {
  if (useHomeDayCompleteHandoff.getState().stage !== 'waiting') return;
  useHomeDayCompleteHandoff.setState({ stage: 'ready' });
}

export function clearDayCompleteForHome(): void {
  useHomeDayCompleteHandoff.setState({ stage: 'idle', unitId: null });
}
