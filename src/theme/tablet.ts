import { Dimensions } from 'react-native';

// Android's own tablet threshold (sw600dp), which also separates every iPad
// (shortest side 744pt and up) from every iPhone (430pt at the largest), so
// one rule covers both platforms.
const TABLET_MIN_SHORT_SIDE = 600;

/**
 * Whether the app is running on a tablet.
 *
 * Measured from `screen`, not `window`: `screen` is the physical device and
 * never changes, while `window` shrinks when an iPad app is put in Split View.
 * The type scale and the onboarding illustration scale are both baked into
 * `StyleSheet.create` and SVG geometry at module load, so they need a number
 * that cannot change afterwards, and only `screen` is one.
 *
 * Known limit, and the reason only those two may use this: a device is not a
 * window. An iPad in a narrow Slide Over window is still a tablet by this test,
 * so it keeps type and drawings a phone-width window does not want. Layout must
 * ask `useIsRegularWidth` instead, which reads the window and re-answers when
 * it changes.
 */
export const isTablet = (() => {
  const { width, height } = Dimensions.get('screen');
  return Math.min(width, height) >= TABLET_MIN_SHORT_SIDE;
})();
