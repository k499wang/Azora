import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Picture,
  Skia,
  createPicture,
  type SkPaint,
  type SkRRect,
} from '@shopify/react-native-skia';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

// Fixed rather than random: the same burst every time reads as choreography,
// and a re-render mid-flight would otherwise reshuffle it.
const PIECES = [
  { angle: -80, distance: 150, size: 10, delay: 0, spin: 220 },
  { angle: -50, distance: 190, size: 7, delay: 40, spin: -180 },
  { angle: -20, distance: 165, size: 12, delay: 90, spin: 300 },
  { angle: 10, distance: 200, size: 8, delay: 20, spin: -260 },
  { angle: 40, distance: 175, size: 11, delay: 70, spin: 190 },
  { angle: 70, distance: 145, size: 7, delay: 110, spin: -320 },
  { angle: 120, distance: 160, size: 9, delay: 50, spin: 240 },
  { angle: 150, distance: 185, size: 12, delay: 0, spin: -200 },
  { angle: 180, distance: 155, size: 8, delay: 95, spin: 280 },
  { angle: 210, distance: 195, size: 10, delay: 30, spin: -230 },
  { angle: 240, distance: 170, size: 7, delay: 80, spin: 210 },
  { angle: 265, distance: 140, size: 11, delay: 60, spin: -290 },
  { angle: -95, distance: 180, size: 8, delay: 65, spin: -250 },
  { angle: -65, distance: 215, size: 11, delay: 15, spin: 310 },
  { angle: -35, distance: 155, size: 9, delay: 105, spin: -210 },
  { angle: -5, distance: 185, size: 12, delay: 55, spin: 270 },
  { angle: 25, distance: 220, size: 7, delay: 85, spin: -330 },
  { angle: 55, distance: 160, size: 10, delay: 25, spin: 230 },
  { angle: 90, distance: 200, size: 8, delay: 100, spin: -280 },
  { angle: 135, distance: 145, size: 11, delay: 35, spin: 200 },
  { angle: 165, distance: 210, size: 7, delay: 75, spin: -300 },
  { angle: 195, distance: 175, size: 12, delay: 10, spin: 260 },
  { angle: 225, distance: 205, size: 9, delay: 115, spin: -240 },
  { angle: 255, distance: 165, size: 10, delay: 45, spin: 290 },
  { angle: -110, distance: 165, size: 12, delay: 20, spin: 240 },
  { angle: -75, distance: 195, size: 9, delay: 90, spin: -270 },
  { angle: -45, distance: 230, size: 11, delay: 40, spin: 320 },
  { angle: -15, distance: 170, size: 8, delay: 110, spin: -220 },
  { angle: 15, distance: 210, size: 12, delay: 5, spin: 250 },
  { angle: 45, distance: 190, size: 10, delay: 70, spin: -310 },
  { angle: 75, distance: 225, size: 7, delay: 30, spin: 280 },
  { angle: 105, distance: 175, size: 11, delay: 100, spin: -240 },
  { angle: 145, distance: 200, size: 9, delay: 55, spin: 300 },
  { angle: 175, distance: 235, size: 12, delay: 15, spin: -260 },
  { angle: 205, distance: 180, size: 8, delay: 85, spin: 220 },
  { angle: 235, distance: 215, size: 11, delay: 60, spin: -300 },
].map((piece) => ({
  ...piece,
  // Trig once at module load rather than per piece per frame: the flight is
  // pure arithmetic on the UI thread, and that is where the frame budget goes.
  dx: Math.cos((piece.angle * Math.PI) / 180),
  dy: Math.sin((piece.angle * Math.PI) / 180),
}));

const DEFAULT_PIECE_COUNT = 12;
/** from launch to the last of a burst fading out on its way down */
const PIECE_FLIGHT_MS = 2600;
/** the last piece's head start, in the same units the flight is written in */
const MAX_PIECE_DELAY = PIECES.reduce(
  (longest, piece) => Math.max(longest, piece.delay),
  0,
);
// A burst is thrown up in a fountain and then falls the way paper does: air
// drag bleeds off the launch, gravity pulls it to a slow terminal speed, and
// each piece sways and flips on the way down. Closed form, so a frame is one
// `exp` per piece rather than a simulation stepped on the UI thread.
/** how quickly air bleeds off a piece's speed, per second */
const BURST_DRAG = 2.4;
/** how much harder than its `distance` a piece is thrown, to clear its peak */
const BURST_THROW = 1.3;
/** the widest a piece leaves the vertical, either side, in degrees */
const BURST_FAN = 65;
/** terminal fall speed, in points per second, before a piece's own size */
const BURST_FALL_SPEED = 140;
/** heavier pieces fall faster */
const BURST_FALL_PER_SIZE = 4;
/** how far a piece sways either side once it is floating, in points */
const BURST_SWAY = 18;
const BURST_FADE_IN = 0.03;
const BURST_FADE_OUT_FROM = 0.75;
/** how long a piece takes to cross the screen when it is falling, not bursting */
const FALL_FLIGHT_MS = 2600;
/** how far a falling piece drifts sideways on its way down */
const FALL_SWAY = 26;

interface ConfettiProps {
  /** Alternated piece to piece, so the burst reads as two-tone rather than flat. */
  pieceColors: readonly [string, string];
  /** Held before the first piece launches, to let the surface under it settle. */
  startDelayMs?: number;
  /** Number of pieces to render from the fixed choreography. */
  pieceCount?: number;
  /** Scales how far the pieces travel, for a burst laid over something small. */
  spread?: number;
  /** Scales the pieces themselves, for a burst meant to be seen across a screen. */
  pieceScale?: number;
  /**
   * Where the pieces come from. `burst` fires them out of the centre of
   * whatever this is laid over; `fall` starts them off the top edge and drops
   * them past the bottom, for a surface the burst would be too small an event
   * for.
   */
  origin?: 'burst' | 'fall';
  /** Flight time of a single piece, from launch until it has faded out. */
  durationMs?: number;
  /**
   * Whether the one-shot flight may begin. Useful when content is pre-mounted.
   * Left false by an owner that fires it through the handle instead.
   */
  active?: boolean;
  /** Called after the final piece has finished, so owners can unmount the tree. */
  onComplete?: () => void;
}

export interface ConfettiHandle {
  /**
   * Fires again from the start, from the tap itself. The canvas and its scene
   * are kept, so a replay costs nothing but the clock restarting — and it does
   * not wait for a render, which on a tick is queued behind the list's.
   */
  fire: () => void;
  stop: () => void;
}

/**
 * A one-shot burst from the centre of whatever it is laid over, or — in `fall`
 * mode — a shower dropping past it from off the top edge. It fires on
 * mount and does not repeat, so remount it — via `key` or by mounting it with
 * the moment it celebrates — rather than looking for a replay control.
 *
 * Every piece reads one clock. The stagger lives in the arithmetic rather than
 * in a `withDelay` per piece, so a burst of thirty is one animation the UI
 * thread drives instead of thirty it has to schedule and tear down.
 */
const Confetti = memo(forwardRef<ConfettiHandle, ConfettiProps>(function Confetti({
  pieceColors,
  startDelayMs = 0,
  pieceCount = DEFAULT_PIECE_COUNT,
  spread = 1,
  pieceScale = 1,
  origin = 'burst',
  durationMs = origin === 'fall' ? FALL_FLIGHT_MS : PIECE_FLIGHT_MS,
  active = true,
  onComplete,
}, ref) {
  const reducedMotion = useReducedMotion();
  const { height, width } = useWindowDimensions();
  const renderedPieceCount = Number.isFinite(pieceCount)
    ? Math.max(0, Math.min(PIECES.length, Math.floor(pieceCount)))
    : DEFAULT_PIECE_COUNT;

  // Falling pieces have to keep arriving for the length of the moment, not
  // launch together — so the stagger is a share of the flight rather than the
  // burst's fixed head starts.
  // A burst launches together, however long its pieces then take to fall.
  const stagger = origin === 'fall' ? 6 : 1;
  const seconds = durationMs / 1000;
  const totalMs = durationMs + MAX_PIECE_DELAY * stagger;
  // Milliseconds since launch, so each piece can find its own place in the
  // flight without an animation of its own.
  const elapsed = useSharedValue(0);

  // Held rather than closed over. The callers pass a fresh closure every render
  // — they are naming the burst that just finished — and depending on it would
  // restart the flight from zero each time the list around it re-rendered.
  const finished = useRef(onComplete);
  finished.current = onComplete;
  const finish = useCallback(() => finished.current?.(), []);

  const stop = useCallback(() => {
    cancelAnimation(elapsed);
    elapsed.value = 0;
  }, [elapsed]);

  const launch = useCallback(() => {
    if (reducedMotion) {
      finish();
      return;
    }

    // The head start is held on the UI thread, not in a timer. A burst is
    // fired from the same tap that writes a to-do to the cache and re-renders
    // the list under it, so a `setTimeout` here — even at zero — is queued
    // behind that work and behind every refetch it sets off. Tick several
    // to-dos quickly and the JS thread is busy for long enough that the burst
    // visibly starts late and stutters out of the gate. Handed to the
    // animation, the launch keeps its own clock whatever the JS thread is
    // doing.
    holdMotionQuiet(startDelayMs + totalMs);
    elapsed.value = 0;
    elapsed.value = withDelay(
      startDelayMs,
      withTiming(
        totalMs,
        { duration: totalMs, easing: Easing.linear },
        (done) => {
          if (done) runOnJS(finish)();
        },
      ),
    );
  }, [elapsed, finish, reducedMotion, startDelayMs, totalMs]);

  useEffect(() => {
    if (!active) {
      stop();
      return;
    }
    launch();
    return () => cancelAnimation(elapsed);
  }, [active, launch, stop, elapsed]);

  useImperativeHandle(ref, () => ({ fire: launch, stop }), [launch, stop]);

  // Out of the picture between flights. The canvas is the whole screen, and
  // left showing while empty it was still blended over every frame of the page
  // under it — every scroll — for as long as the screen was open.
  const flyingStyle = useAnimatedStyle(() => ({
    opacity: elapsed.value > 0 && elapsed.value < totalMs ? 1 : 0,
  }));

  // Everything about a piece that does not change while it is in the air,
  // built once per burst: its shape, the paint it is drawn with, and where in
  // the flight it launches. The frame loop is then arithmetic and six canvas
  // calls per piece, with nothing allocated in it.
  const scene = useMemo(
    () =>
      buildScene({
        pieceCount: renderedPieceCount,
        pieceColors,
        spread,
        pieceScale,
        stagger,
        fallHeight: height,
        fallWidth: width,
      }),
    [
      renderedPieceCount,
      pieceColors,
      spread,
      pieceScale,
      stagger,
      height,
      width,
    ],
  );

  const picture = useDerivedValue(
    () =>
      createPicture((canvas) => {
        const originX = scene.width / 2;
        const originY = scene.height / 2;

        for (let i = 0; i < scene.pieces.length; i += 1) {
          const piece = scene.pieces[i];
          const linear = Math.min(
            1,
            Math.max(0, (elapsed.value - piece.launchMs) / durationMs),
          );
          // Not yet launched, or landed. Either way there is nothing to draw,
          // and skipping is cheaper than drawing at zero alpha.
          if (linear <= 0 || linear >= 1) continue;

          let x: number;
          let y: number;
          let turn: number;
          let alpha: number;

          let flip = 1;

          if (origin === 'fall') {
            alpha = linear > 0.85 ? (1 - linear) * 6.6 : 1;
            x = piece.column + Math.sin(linear * Math.PI * 2 + piece.dy) * FALL_SWAY;
            y = piece.fallFrom + (piece.fallTo - piece.fallFrom) * linear;
            turn = linear * piece.spin;
          } else {
            const t = linear * seconds;
            const thrown = 1 - Math.exp(-BURST_DRAG * t);
            // The sway grows in as the throw dies away, so the launch is
            // straight and only the fall drifts.
            x =
              (piece.vx / BURST_DRAG) * thrown +
              Math.sin(t * piece.swayRate + piece.phase) * BURST_SWAY * thrown;
            y =
              ((piece.vy - piece.fallSpeed) / BURST_DRAG) * thrown +
              piece.fallSpeed * t;
            turn = t * piece.spin;
            // Seen edge-on and face-on in turn, which is what reads as paper
            // tumbling rather than a chip spinning flat.
            flip = Math.cos(t * piece.flipRate + piece.phase);
            alpha =
              linear < BURST_FADE_IN
                ? linear / BURST_FADE_IN
                : linear > BURST_FADE_OUT_FROM
                  ? (1 - linear) / (1 - BURST_FADE_OUT_FROM)
                  : 1;
          }

          if (alpha <= 0) continue;

          // The paint is copied into the recording as it is drawn, so the two
          // tones are re-alpha'd piece by piece rather than needing one paint
          // each.
          piece.paint.setAlphaf(alpha);
          canvas.save();
          canvas.translate(originX + x, originY + y);
          canvas.rotate(turn, 0, 0);
          canvas.scale(1, flip);
          canvas.drawRRect(piece.shape, piece.paint);
          canvas.restore();
        }
      }),
    [scene, durationMs, seconds, origin],
  );

  if (reducedMotion) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.layer, flyingStyle]}>
      <Canvas style={{ width: scene.width, height: scene.height }}>
        <Picture picture={picture} />
      </Canvas>
    </Animated.View>
  );
}));

interface ScenePiece {
  shape: SkRRect;
  paint: SkPaint;
  /** where in the flight this piece leaves, in milliseconds */
  launchMs: number;
  dx: number;
  dy: number;
  /** degrees turned in a fall, or per second in a burst */
  spin: number;
  /** a burst's launch velocity, in points per second */
  vx: number;
  vy: number;
  /** how fast a burst piece is falling once the throw has died */
  fallSpeed: number;
  /** radians per second */
  swayRate: number;
  flipRate: number;
  phase: number;
  /** the column a falling piece drops down */
  column: number;
  fallFrom: number;
  fallTo: number;
}

interface Scene {
  width: number;
  height: number;
  pieces: ScenePiece[];
}

/** the corner on a piece, small enough to read as a rounded fleck */
const PIECE_RADIUS = 2;

/**
 * The whole burst as one canvas rather than a view per piece.
 *
 * A piece used to be an `Animated.View` with an animated style of its own,
 * which is thirty-odd views created on the frame a to-do is ticked — in the
 * same commit as the list re-rendering under it — and thirty-odd sets of props
 * written to the shadow tree every frame after that. Tick several to-dos
 * quickly and that commit is what the UI thread is doing instead of drawing the
 * animation, which is why the burst, and anything else moving at the time,
 * stuttered. One canvas is one view and one recorded picture per frame, so a
 * burst costs the tree nothing at all.
 */
function buildScene({
  pieceCount,
  pieceColors,
  spread,
  pieceScale,
  stagger,
  fallHeight,
  fallWidth,
}: {
  pieceCount: number;
  pieceColors: readonly [string, string];
  spread: number;
  pieceScale: number;
  stagger: number;
  fallHeight: number;
  fallWidth: number;
}): Scene {
  const paints = pieceColors.map((color) => {
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setColor(Skia.Color(color));
    return paint;
  });

  const used = PIECES.slice(0, pieceCount);
  let widest = 0;
  const pieces = used.map((piece, index) => {
    const pieceWidth = piece.size * pieceScale;
    const pieceHeight = piece.size * 0.6 * pieceScale;
    widest = Math.max(widest, pieceWidth);
    // The burst's angles go all the way round; folded into an upward fan so
    // every piece is thrown up before it falls.
    const fan = ((((piece.angle % 360) + 360) % 360) / 360 - 0.5) * 2 * BURST_FAN;
    const launch = ((fan - 90) * Math.PI) / 180;
    const speed = piece.distance * spread * BURST_DRAG * BURST_THROW;

    return {
      // Centred on the origin so a piece turns about itself, and the canvas
      // only has to be moved to where the piece has flown.
      shape: Skia.RRectXY(
        Skia.XYWHRect(
          -pieceWidth / 2,
          -pieceHeight / 2,
          pieceWidth,
          pieceHeight,
        ),
        PIECE_RADIUS,
        PIECE_RADIUS,
      ),
      paint: paints[piece.size % 2 === 0 ? 0 : 1],
      launchMs: piece.delay * stagger,
      dx: piece.dx,
      dy: piece.dy,
      spin: piece.spin,
      vx: Math.cos(launch) * speed,
      vy: Math.sin(launch) * speed,
      fallSpeed: BURST_FALL_SPEED + piece.size * BURST_FALL_PER_SIZE,
      swayRate: Math.PI * (1.2 + (index % 3) * 0.35),
      flipRate: Math.PI * (2.4 + (piece.size % 4) * 0.5),
      phase: piece.delay / 20,
      // The canvas is centred on the burst, so a fall runs from half its height
      // above the middle to half below, down a column picked by the piece's own
      // angle.
      column: piece.dx * (fallWidth / 2 - piece.size * 2),
      fallFrom: -fallHeight / 2 - piece.size * 2,
      fallTo: fallHeight / 2 + piece.size * 2,
    };
  });

  // A fall crosses the whole screen, and a burst rises and then drops past the
  // bottom of it; either way the canvas is the screen, so Skia never clips a
  // piece still in flight.
  return {
    width: fallWidth,
    height: fallHeight + widest * 4,
    pieces,
  };
}

export default Confetti;

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
