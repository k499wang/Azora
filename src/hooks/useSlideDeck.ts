import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, useWindowDimensions } from 'react-native';

/**
 * Long enough to read as a page turning, short enough not to be a wait.
 *
 * Shared by every deck so two screens built from the same parts never move at
 * two different speeds — which reads, wrongly, as one of them being slower.
 */
export const SLIDE_MS = 320;

const SLIDE_EASING = Easing.bezier(0.22, 1, 0.36, 1);

export interface SlideDeck {
  /** The page on screen. During a turn, the page being turned to. */
  index: number;
  pageCount: number;
  /**
   * True while a page is moving.
   *
   * Nothing is touchable mid-turn. A tap that lands on the page arriving is a
   * tap the user aimed at the page leaving.
   */
  isTransitioning: boolean;
  pageWidth: number;
  stripWidth: number;
  translateX: Animated.AnimatedInterpolation<number>;
  goTo: (next: number) => void;
  /** Advances one page, or does nothing on the last. */
  next: () => void;
  atEnd: boolean;
  /**
   * Whether this page is the one on screen and settled, read synchronously.
   *
   * For a callback fired by something inside a page while the deck is moving —
   * a control released a frame after its page began to leave. `index` and
   * `isTransitioning` are state, and a handler captured before the turn began
   * sees the values from before it, which is exactly the case this guards.
   */
  isLive: (page: number) => boolean;
}

/**
 * A strip of full-width pages that moves sideways.
 *
 * Sideways rather than up: the direction carries the progress, so a bar at the
 * top is a confirmation rather than the only way to tell how much is left.
 *
 * The hook owns the movement and nothing else — what the pages are, when they
 * turn and what turning one means are the screen's business. The check-in turns
 * its own pages when an answer settles; a lesson turns when it is tapped.
 */
function useCallbackIsLive(
  liveIndex: { current: number },
  moving: { current: boolean },
) {
  return useCallback(
    (page: number) => !moving.current && liveIndex.current === page,
    [liveIndex, moving],
  );
}

export function useSlideDeck(pageCount: number): SlideDeck {
  const { width } = useWindowDimensions();
  const slide = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const liveIndex = useRef(0);
  const moving = useRef(false);

  useEffect(
    () => () => {
      slide.stopAnimation();
    },
    [slide],
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      moving.current = true;
      liveIndex.current = nextIndex;
      setIsTransitioning(true);
      Animated.timing(slide, {
        toValue: nextIndex,
        duration: SLIDE_MS,
        easing: SLIDE_EASING,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        moving.current = false;
        setIsTransitioning(false);
      });
      setIndex(nextIndex);
    },
    [slide],
  );

  // Off the ref, not off `index`: two taps inside one frame are two taps at
  // the same page as far as state is concerned, and the second would turn to
  // the page the first was already turning to.
  const next = useCallback(() => {
    if (liveIndex.current >= pageCount - 1) return;
    goTo(liveIndex.current + 1);
  }, [goTo, pageCount]);

  return {
    index,
    pageCount,
    isTransitioning,
    pageWidth: width,
    stripWidth: width * pageCount,
    // A single interpolation rather than a value per page, so the whole strip
    // is one transform the native driver can own.
    translateX: slide.interpolate({
      inputRange: [0, Math.max(pageCount - 1, 1)],
      outputRange: [0, -width * Math.max(pageCount - 1, 1)],
    }),
    goTo,
    next,
    atEnd: index >= pageCount - 1,
    isLive: useCallbackIsLive(liveIndex, moving),
  };
}
