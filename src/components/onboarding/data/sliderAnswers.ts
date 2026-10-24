import type {
  DrainedFrequencyId,
  LifestyleHappinessId,
  RoutineHappinessId,
} from './routineOptions';

export const SLIDER_MIN = 1;
export const SLIDER_MAX = 9;
/** Where a slider rests before it is touched: the middle, so it leads nowhere. */
export const SLIDER_START = 5;

/**
 * The 1–9 scale read back as the answer the choice list used to record, so the
 * plan, echoes and analytics keep the same ids. Each entry is the highest value
 * that still counts as that answer.
 */
function bucket<Id extends string>(value: number, buckets: readonly [number, Id][]): Id {
  return (buckets.find(([upTo]) => value <= upTo) ?? buckets[buckets.length - 1])[1];
}

/** 1 = everything is piling up, 9 = on top of it. */
export function routineHappinessFromSlider(value: number): RoutineHappinessId {
  return bucket(value, [[2, 'none'], [4, 'shaky'], [6, 'fine'], [9, 'love']]);
}

/** 1 = rarely drained, 9 = drained every day. */
export function drainedFrequencyFromSlider(value: number): DrainedFrequencyId {
  return bucket(value, [[2, 'rarely'], [5, 'weekly'], [7, 'mostDays'], [9, 'daily']]);
}

/** 1 = not happy with it, 9 = love it. */
export function lifestyleHappinessFromSlider(value: number): LifestyleHappinessId {
  return bucket(value, [[2, 'unhappy'], [4, 'better'], [6, 'okay'], [9, 'love']]);
}
