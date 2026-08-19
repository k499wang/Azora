/**
 * Pinch, drag and double-tap over a canvas that is bigger than the screen.
 *
 * Everything runs on the UI thread: the gestures write shared values and
 * nothing here re-renders while a finger is down, which is what keeps the hotel
 * at sixty frames however many rooms are in it.
 *
 * Panning is deliberately unbounded — the canvas floats free rather than
 * fighting the edges of its content — so double-tap is the way home.
 */
import { useEffect, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { Fit } from './pyramidLayout';

/** how far past a zoom limit a pinch can stretch before it springs back */
const RESISTANCE = 0.28;
const SPRING = { damping: 18, stiffness: 160 };
const SETTLE_MS = 260;
/** a flick coasts nearly a second; higher reads as ice, lower as mud */
const DECELERATION = 0.995;

interface Options {
  /** where double-tap goes to see everything; null until the canvas is measured */
  home: Fit | null;
  /**
   * Where the canvas sits when it first opens. Separate from `home` because the
   * hotel opens close on one room and stands back to the whole pyramid, so the
   * first view and the stand-back view are not the same view.
   */
  start: Fit | null;
  /** the loosest a pinch can settle, as a multiple of `home.scale` */
  minScaleFactor: number;
  /** the tightest a pinch can settle */
  maxScale: number;
  /** where double-tap goes to look at one thing closely */
  closeScale: number;
}

export interface PinchZoomPan {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  gesture: ReturnType<typeof Gesture.Race>;
}

function resist(value: number, min: number, max: number): number {
  'worklet';
  if (value < min) return min - (min - value) * RESISTANCE;
  if (value > max) return max + (value - max) * RESISTANCE;
  return value;
}

export function usePinchZoomPan({
  home,
  start,
  minScaleFactor,
  maxScale,
  closeScale,
}: Options): PinchZoomPan {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // The pinch's own scale, before the limits push back on it. Resisting the
  // displayed value in place would compound: every frame would resist a number
  // that was already resisted, and the stretch would die within a few pixels.
  const rawScale = useSharedValue(1);
  const lastPinchScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const homeScale = useSharedValue(1);
  const homeX = useSharedValue(0);
  const homeY = useSharedValue(0);
  const placed = useSharedValue(false);

  useEffect(() => {
    if (home == null || start == null) return;

    homeScale.value = home.scale;
    homeX.value = home.x;
    homeY.value = home.y;

    // Only the first measurement places the canvas. After that the user owns
    // where it sits, and a rotation must not yank it back.
    if (placed.value) return;

    placed.value = true;
    scale.value = start.scale;
    rawScale.value = start.scale;
    translateX.value = start.x;
    translateY.value = start.y;
  }, [
    home,
    start,
    homeScale,
    homeX,
    homeY,
    placed,
    rawScale,
    scale,
    translateX,
    translateY,
  ]);

  const gesture = useMemo(() => {
    /**
     * Momentum from an earlier flick is still writing to these values when the
     * fingers come back down. Left running it fights whatever the new gesture
     * writes, and the canvas lurches between the two.
     */
    const stop = () => {
      'worklet';
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scale);
    };

    /** move the canvas so `factor` zoom leaves the point at (x, y) where it is */
    const zoomAbout = (x: number, y: number, factor: number) => {
      'worklet';
      translateX.value = x - (x - translateX.value) * factor;
      translateY.value = y - (y - translateY.value) * factor;
    };

    const pinch = Gesture.Pinch()
      .onBegin((event) => {
        stop();
        rawScale.value = scale.value;
        lastPinchScale.value = 1;
        focalX.value = event.focalX;
        focalY.value = event.focalY;
      })
      .onUpdate((event) => {
        const step = event.scale / lastPinchScale.value;
        lastPinchScale.value = event.scale;
        rawScale.value *= step;

        const next = resist(
          rawScale.value,
          homeScale.value * minScaleFactor,
          maxScale,
        );

        // Zoom about the point between the fingers, so whatever is under them
        // stays under them. Without this the canvas slides away as it grows and
        // the pinch feels like it is fighting you.
        zoomAbout(event.focalX, event.focalY, next / scale.value);
        scale.value = next;
        focalX.value = event.focalX;
        focalY.value = event.focalY;
      })
      .onEnd(() => {
        const settled = Math.min(
          Math.max(scale.value, homeScale.value * minScaleFactor),
          maxScale,
        );
        if (settled === scale.value) return;

        // Let the stretch go, around the point it was stretched about — which
        // by now is the middle of whatever the user is looking at.
        const factor = settled / scale.value;
        translateX.value = withSpring(
          focalX.value - (focalX.value - translateX.value) * factor,
          SPRING,
        );
        translateY.value = withSpring(
          focalY.value - (focalY.value - translateY.value) * factor,
          SPRING,
        );
        scale.value = withSpring(settled, SPRING);
        rawScale.value = settled;
      });

    const pan = Gesture.Pan()
      // Deliberately not capped to one finger. Capping it ended the pan the
      // instant a second finger landed to pinch, and an ended pan starts its
      // momentum — so every pinch began by fighting a decay animation for the
      // same two values. Two fingers move their own centroid, which is the
      // focal point, so letting the pan track them is what makes a pinch drag.
      .averageTouches(true)
      .onBegin(stop)
      .onChange((event) => {
        translateX.value += event.changeX;
        translateY.value += event.changeY;
      })
      .onEnd((event) => {
        translateX.value = withDecay({
          velocity: event.velocityX,
          deceleration: DECELERATION,
        });
        translateY.value = withDecay({
          velocity: event.velocityY,
          deceleration: DECELERATION,
        });
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(SETTLE_MS)
      .onEnd((event) => {
        stop();

        const isClose = scale.value > (homeScale.value + closeScale) / 2;
        const settle = { duration: SETTLE_MS };

        if (isClose) {
          scale.value = withTiming(homeScale.value, settle);
          translateX.value = withTiming(homeX.value, settle);
          translateY.value = withTiming(homeY.value, settle);
          rawScale.value = homeScale.value;
          return;
        }

        const factor = closeScale / scale.value;
        translateX.value = withTiming(
          event.x - (event.x - translateX.value) * factor,
          settle,
        );
        translateY.value = withTiming(
          event.y - (event.y - translateY.value) * factor,
          settle,
        );
        scale.value = withTiming(closeScale, settle);
        rawScale.value = closeScale;
      });

    // Raced, not made exclusive: exclusivity would hold every drag back until
    // the double-tap had failed, and a drag that starts late reads as a dropped
    // frame. A tap does not move, so it wins the race on its own.
    return Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));
  }, [
    closeScale,
    focalX,
    focalY,
    homeScale,
    homeX,
    homeY,
    lastPinchScale,
    maxScale,
    minScaleFactor,
    rawScale,
    scale,
    translateX,
    translateY,
  ]);

  return { scale, translateX, translateY, gesture };
}
