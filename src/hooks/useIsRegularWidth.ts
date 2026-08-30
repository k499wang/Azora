import { useWindowDimensions } from 'react-native';
import { isRegularWidth } from '../theme/breakpoints';

/**
 * Whether the app currently has tablet-sized space to lay out in.
 *
 * Window-derived and reactive, so it answers again when an iPad window is
 * resized or rotated. Deliberately not a device check: the same iPad is a
 * regular-width canvas full screen and a compact one in Slide Over, and only
 * the window knows which is true right now.
 */
export function useIsRegularWidth(): boolean {
  const { width } = useWindowDimensions();
  return isRegularWidth(width);
}
