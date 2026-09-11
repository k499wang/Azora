/**
 * Pinch, drag and double-tap over a canvas that is bigger than the screen.
 *
 * Everything runs on the UI thread: the gestures write shared values and
 * nothing here re-renders while a finger is down, which is what keeps the hotel
 * at sixty frames however many rooms are in it.
 *
 * Panning is bounded to the content, loosely: the pyramid may be dragged up to
 * half a screen past the edge it would otherwise stop at, so it can sit
 * off-centre, but it can never be flung away into empty canvas. Past that the
 * drag resists and springs back, the same way the zoom limits already do.
 */
import { useCallback, useEffect, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { Bounds, Fit } from './pyramidLayout';

/** how far past a zoom limit a pinch can stretch before it springs back */
const RESISTANCE = 0.28;
const SPRING = { damping: 18, stiffness: 160 };
const SETTLE_MS = 260;
/** a flick coasts nearly a second; higher reads as ice, lower as mud */
const DECELERATION = 0.995;
/**
 * How far past the content a pan may settle, as a fraction of the viewport.
 *
 * Zero would pin the pyramid's edge to the screen's, which reads as a scroll
 * view rather than a canvas. Half a screen is enough to push a room you are
 * looking at out of the middle without ever losing the hotel off the side.
 */
const PAN_SLACK = 0.5;

interface Options {
  /**
   * Where the canvas opens, and where double-tap goes to see everything again.
   * Null until the canvas is measured.
   */
  home: Fit | null;
  /** the loosest a pinch can settle, as a multiple of `home.scale` */
  minScaleFactor: number;
  /** the tightest a pinch can settle */
  maxScale: number;
  /** where double-tap goes to look at one thing closely */
  closeScale: number;
  /** what the pan is held to, in canvas units. Null until it is known. */
  content: Bounds | null;
  /** the canvas on screen, in points. Null until it is measured. */
  viewport: { width: number; height: number } | null;
}

export interface PinchZoomPan {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  gesture: ReturnType<typeof Gesture.Race>;
  /** the same zoom a pinch does, from a button: multiply the scale about a point */
  zoomBy: (factor: number, focusX: number, focusY: number) => void;
}

function resist(value: number, min: number, max: number): number {
  'worklet';
  if (value < min) return min - (min - value) * RESISTANCE;
  if (value > max) return max + (value - max) * RESISTANCE;
  return value;
}

interface Range {
  lo: number;
  hi: number;
}

function clamp(value: number, range: Range): number {
  'worklet';
  return Math.min(Math.max(value, range.lo), range.hi);
}

/**
 * The translations that keep the content on screen, on one axis.
 *
 * The two ends are "content's far edge at the viewport's far edge" and
 * "content's near edge at the viewport's near edge", and which of them is the
 * lower number depends on whether the content is currently bigger than the
 * viewport. Ordering them rather than assuming covers both: zoomed in the range
 * is the scrollable overhang, zoomed out it is the room the content has to
 * slide around inside the screen. The slack is added to both ends either way.
 */
function panRange(
  min: number,
  max: number,
  scale: number,
  viewport: number,
): Range {
  'worklet';
  const near = -min * scale;
  const far = viewport - max * scale;
  const slack = viewport * PAN_SLACK;

  return {
    lo: Math.min(near, far) - slack,
    hi: Math.max(near, far) + slack,
  };
}

export function usePinchZoomPan({
  home,
  minScaleFactor,
  maxScale,
  closeScale,
  content,
  viewport,
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

  // The pan's own offset, before the bounds push back, for the same reason the
  // pinch keeps `rawScale`: resisting a value that is already resisted in place
  // would compound and kill the stretch within a few pixels.
  const rawX = useSharedValue(0);
  const rawY = useSharedValue(0);

  const contentMinX = useSharedValue(-Infinity);
  const contentMaxX = useSharedValue(Infinity);
  const contentMinY = useSharedValue(-Infinity);
  const contentMaxY = useSharedValue(Infinity);
  const viewportWidth = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const bounded = useSharedValue(false);

  const homeScale = useSharedValue(1);
  const homeX = useSharedValue(0);
  const homeY = useSharedValue(0);
  const placed = useSharedValue(false);

  useEffect(() => {
    if (home == null) return;

    homeScale.value = home.scale;
    homeX.value = home.x;
    homeY.value = home.y;

    // Only the first measurement places the canvas. After that the user owns
    // where it sits, and a rotation must not yank it back.
    if (placed.value) return;

    placed.value = true;
    scale.value = home.scale;
    rawScale.value = home.scale;
    translateX.value = home.x;
    translateY.value = home.y;
    rawX.value = home.x;
    rawY.value = home.y;
  }, [
    home,
    homeScale,
    homeX,
    homeY,
    placed,
    rawScale,
    rawX,
    rawY,
    scale,
    translateX,
    translateY,
  ]);

  useEffect(() => {
    const known = content != null && viewport != null;
    bounded.value = known;
    if (!known) return;

    contentMinX.value = content.minX;
    contentMaxX.value = content.maxX;
    contentMinY.value = content.minY;
    contentMaxY.value = content.maxY;
    viewportWidth.value = viewport.width;
    viewportHeight.value = viewport.height;
  }, [
    bounded,
    content,
    contentMaxX,
    contentMaxY,
    contentMinX,
    contentMinY,
    viewport,
    viewportHeight,
    viewportWidth,
  ]);

  /** where the pan may settle on each axis, at the scale it is settling at */
  const limits = useCallback(
    (at: number) => {
      'worklet';
      if (!bounded.value) {
        return {
          x: { lo: -Infinity, hi: Infinity },
          y: { lo: -Infinity, hi: Infinity },
        };
      }

      return {
        x: panRange(contentMinX.value, contentMaxX.value, at, viewportWidth.value),
        y: panRange(contentMinY.value, contentMaxY.value, at, viewportHeight.value),
      };
    },
    [
      bounded,
      contentMaxX,
      contentMaxY,
      contentMinX,
      contentMinY,
      viewportHeight,
      viewportWidth,
    ],
  );

  const zoomBy = useCallback(
    (factor: number, focusX: number, focusY: number) => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scale);

      const next = Math.min(
        Math.max(scale.value * factor, homeScale.value * minScaleFactor),
        maxScale,
      );
      if (next === scale.value) return;

      const applied = next / scale.value;
      const settle = { duration: SETTLE_MS };
      // Zooming out grows the room the content has to move in, so the offset
      // that was legal a moment ago may not be: the button lands inside the
      // bounds rather than animating to a place a pan would spring back from.
      const bound = limits(next);

      const toX = clamp(focusX - (focusX - translateX.value) * applied, bound.x);
      const toY = clamp(focusY - (focusY - translateY.value) * applied, bound.y);

      translateX.value = withTiming(toX, settle);
      translateY.value = withTiming(toY, settle);
      scale.value = withTiming(next, settle);
      rawScale.value = next;
      rawX.value = toX;
      rawY.value = toY;
    },
    [
      homeScale,
      limits,
      maxScale,
      minScaleFactor,
      rawScale,
      rawX,
      rawY,
      scale,
      translateX,
      translateY,
    ],
  );

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

        // Let the stretch go, around the point it was stretched about — which
        // by now is the middle of whatever the user is looking at. A pinch that
        // settled inside the zoom limits still comes through here: zooming out
        // can carry the canvas past the pan bounds without the scale ever
        // leaving them.
        const factor = settled / scale.value;
        const bound = limits(settled);
        const toX = clamp(
          focalX.value - (focalX.value - translateX.value) * factor,
          bound.x,
        );
        const toY = clamp(
          focalY.value - (focalY.value - translateY.value) * factor,
          bound.y,
        );

        rawX.value = toX;
        rawY.value = toY;
        rawScale.value = settled;

        if (toX !== translateX.value) translateX.value = withSpring(toX, SPRING);
        if (toY !== translateY.value) translateY.value = withSpring(toY, SPRING);
        if (settled !== scale.value) scale.value = withSpring(settled, SPRING);
      });

    const pan = Gesture.Pan()
      // Deliberately not capped to one finger. Capping it ended the pan the
      // instant a second finger landed to pinch, and an ended pan starts its
      // momentum — so every pinch began by fighting a decay animation for the
      // same two values. Two fingers move their own centroid, which is the
      // focal point, so letting the pan track them is what makes a pinch drag.
      .averageTouches(true)
      .onBegin(() => {
        stop();
        // Whatever was still decaying owns the offset now; the raw pan picks up
        // from where it actually is rather than from where it last let go.
        rawX.value = translateX.value;
        rawY.value = translateY.value;
      })
      .onChange((event) => {
        rawX.value += event.changeX;
        rawY.value += event.changeY;

        const bound = limits(scale.value);
        translateX.value = resist(rawX.value, bound.x.lo, bound.x.hi);
        translateY.value = resist(rawY.value, bound.y.lo, bound.y.hi);
      })
      .onEnd((event) => {
        const bound = limits(scale.value);
        const toX = clamp(translateX.value, bound.x);
        const toY = clamp(translateY.value, bound.y);

        rawX.value = toX;
        rawY.value = toY;

        // Dragged past the edge, the flick is spent on the stretch: it springs
        // back rather than coasting off from where it was already being held.
        if (toX !== translateX.value) {
          translateX.value = withSpring(toX, SPRING);
        } else {
          // Momentum is clamped rather than sprung, so a flick that runs into
          // the edge stops there instead of overshooting and bouncing.
          translateX.value = withDecay({
            velocity: event.velocityX,
            deceleration: DECELERATION,
            clamp: [bound.x.lo, bound.x.hi],
          });
        }

        if (toY !== translateY.value) {
          translateY.value = withSpring(toY, SPRING);
        } else {
          translateY.value = withDecay({
            velocity: event.velocityY,
            deceleration: DECELERATION,
            clamp: [bound.y.lo, bound.y.hi],
          });
        }
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
          rawX.value = homeX.value;
          rawY.value = homeY.value;
          return;
        }

        const factor = closeScale / scale.value;
        const bound = limits(closeScale);
        const toX = clamp(event.x - (event.x - translateX.value) * factor, bound.x);
        const toY = clamp(event.y - (event.y - translateY.value) * factor, bound.y);

        translateX.value = withTiming(toX, settle);
        translateY.value = withTiming(toY, settle);
        scale.value = withTiming(closeScale, settle);
        rawScale.value = closeScale;
        rawX.value = toX;
        rawY.value = toY;
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
    limits,
    maxScale,
    minScaleFactor,
    rawScale,
    rawX,
    rawY,
    scale,
    translateX,
    translateY,
  ]);

  return { scale, translateX, translateY, gesture, zoomBy };
}
