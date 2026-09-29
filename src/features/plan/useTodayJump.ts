import { useCallback, useRef, useState, type RefObject } from 'react';
import type { ScrollView, View } from 'react-native';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

export type TodayDirection = 'up' | 'down';

interface Options {
  scrollRef: RefObject<Pick<ScrollView, 'scrollTo'> | null>;
  scrollY: SharedValue<number>;
  /** The first window y not covered by the screen's chrome. */
  visibleTop: number;
  /** The last window y not covered by the screen's chrome. */
  visibleBottom: number;
}

/**
 * Where today's node is relative to what is on screen, and a way back to it.
 *
 * The node is measured once per layout and stored with the scroll offset
 * folded in, so following the scroll after that is arithmetic on the UI
 * thread rather than a measurement per frame. It only counts as gone once it
 * is fully off screen by a margin, so the way back does not flicker in for a
 * node that is merely tucked under the title.
 */
export function useTodayJump({
  scrollRef,
  scrollY,
  visibleTop,
  visibleBottom,
}: Options) {
  const node = useRef<View | null>(null);
  // Window centre of the node at scroll offset zero; null with no node.
  const anchor = useSharedValue<number | null>(null);
  const reach = useSharedValue(0);
  const [direction, setDirection] = useState<TodayDirection | null>(null);

  const measure = useCallback(() => {
    const current = node.current;
    if (current == null) {
      anchor.value = null;
      return;
    }
    current.measureInWindow((_x, y, _width, height) => {
      if (height <= 0) return;
      anchor.value = y + height / 2 + scrollY.value;
      reach.value = height;
    });
  }, [anchor, reach, scrollY]);

  const todayRef = useCallback(
    (next: View | null) => {
      node.current = next;
      measure();
    },
    [measure],
  );

  useAnimatedReaction(
    (): TodayDirection | null => {
      if (anchor.value == null) return null;
      const centre = anchor.value - scrollY.value;
      if (centre < visibleTop - reach.value) return 'up';
      if (centre > visibleBottom + reach.value) return 'down';
      return null;
    },
    (next, previous) => {
      if (next !== previous) runOnJS(setDirection)(next);
    },
    [visibleTop, visibleBottom],
  );

  const jump = useCallback(() => {
    if (anchor.value == null) return;
    const middle = (visibleTop + visibleBottom) / 2;
    scrollRef.current?.scrollTo({
      y: Math.max(0, anchor.value - middle),
      animated: true,
    });
  }, [anchor, scrollRef, visibleTop, visibleBottom]);

  return { direction, todayRef, remeasure: measure, jump };
}
