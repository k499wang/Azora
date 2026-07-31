import { useSharedValue, type SharedValue } from 'react-native-reanimated';

/**
 * The breath position every ambient layer reads: 0 is fully exhaled, 1 is fully
 * inhaled. `BreathingCircle` writes it from the same calls that drive its own
 * animation, so a background can never drift out of sync with the circle, and
 * pause / resume / reset are inherited for free.
 */
export type BreathEnvelope = SharedValue<number>;

export const BREATH_EXHALED = 0;
export const BREATH_INHALED = 1;

export function useBreathEnvelope(): BreathEnvelope {
  return useSharedValue(BREATH_EXHALED);
}
