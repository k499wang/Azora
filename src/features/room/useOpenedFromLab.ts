import { useRoute } from '@react-navigation/native';
import type { RoomScreenParams } from '../../app/navigation';

/**
 * True when this room screen was opened from the dev lab.
 *
 * The room screens carry no chrome in the real flow — they are entered one way
 * and left one way, so a back arrow would offer an exit the flow has no state
 * for, and the bar itself ate the space above the room. The lab jumps into them
 * out of order, though, so a screen reached that way needs a way out.
 *
 * `__DEV__` is checked here rather than at the navigate call, so a release build
 * cannot show the arrow even if the param arrived somehow.
 */
export function useOpenedFromLab(): boolean {
  const params = useRoute().params as RoomScreenParams;
  return __DEV__ && params?.fromLab === true;
}
