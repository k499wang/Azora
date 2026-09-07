import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Picture,
  Skia,
  createPicture,
  type SkPaint,
  type SkRRect,
} from '@shopify/react-native-skia';
import {
  Easing,
  cancelAnimation,
  runOnJS,
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
const PIECE_FLIGHT_MS = 1100;
/** the last piece's head start, in the same units the flight is written in */
const MAX_PIECE_DELAY = PIECES.reduce(
  (longest, piece) => Math.max(longest, piece.delay),
  0,
);
const GRAVITY_DROP = 90;
const FLIGHT_EASING = Easing.out(Easing.quad);
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
  /**
   * Flight time of a single piece, with the launch stagger scaled to match. A
   * burst over something small wants both shorter — the pieces have less ground
   * to cover, and at the full duration they hang in the air after the moment
   * they were celebrating has passed.
   */
  durationMs?: number;
  /** Whether the one-shot flight may begin. Useful when content is pre-mounted. */
  active?: boolean;
  /** Called after the final piece has finished, so owners can unmount the tree. */
  onComplete?: () => void;
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
const Confetti = memo(function Confetti({
  pieceColors,
  startDelayMs = 0,
  pieceCount = DEFAULT_PIECE_COUNT,
  spread = 1,
  pieceScale = 1,
  origin = 'burst',
  durationMs = origin === 'fall' ? FALL_FLIGHT_MS : PIECE_FLIGHT_MS,
  active = true,
  onComplete,
}: ConfettiProps) {
  const reducedMotion = useReducedMotion();
  const { height, width } = useWindowDimensions();
  const renderedPieceCount = Number.isFinite(pieceCount)
    ? Math.max(0, Math.min(PIECES.length, Math.floor(pieceCount)))
    : DEFAULT_PIECE_COUNT;

  // Falling pieces have to keep arriving for the length of the moment, not
  // launch together — so the stagger is a share of the flight rather than the
  // burst's fixed head starts.
  const stagger = origin === 'fall' ? 6 : durationMs / PIECE_FLIGHT_MS;
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

  useEffect(() => {
    if (!active) {
      cancelAnimation(elapsed);
      elapsed.value = 0;
      return;
    }

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
    return () => cancelAnimation(elapsed);
  }, [active, elapsed, finish, reducedMotion, startDelayMs, totalMs]);

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
        origin,
        stagger,
        fallHeight: height,
        fallWidth: width,
      }),
    [
      renderedPieceCount,
      pieceColors,
      spread,
      pieceScale,
      origin,
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

          if (origin === 'fall') {
            alpha = linear > 0.85 ? (1 - linear) * 6.6 : 1;
            x = piece.column + Math.sin(linear * Math.PI * 2 + piece.dy) * FALL_SWAY;
            y = piece.fallFrom + (piece.fallTo - piece.fallFrom) * linear;
            turn = linear * piece.spin;
          } else {
            const fly = FLIGHT_EASING(linear);
            const travel = fly * piece.distance;
            alpha =
              fly < 0.1
                ? fly * 10
                : fly > 0.75
                  ? Math.max(0, 1 - (fly - 0.75) * 4)
                  : 1;
            x = piece.dx * travel;
            // Gravity on the way out — pieces arc rather than shooting in
            // straight lines.
            y = piece.dy * travel + fly * piece.drop;
            turn = fly * piece.spin;
          }

          if (alpha <= 0) continue;

          // The paint is copied into the recording as it is drawn, so the two
          // tones are re-alpha'd piece by piece rather than needing one paint
          // each.
          piece.paint.setAlphaf(alpha);
          canvas.save();
          canvas.translate(originX + x, originY + y);
          canvas.rotate(turn, 0, 0);
          canvas.drawRRect(piece.shape, piece.paint);
          canvas.restore();
        }
      }),
    [scene, durationMs, origin],
  );

  if (reducedMotion) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Canvas style={{ width: scene.width, height: scene.height }}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
});

interface ScenePiece {
  shape: SkRRect;
  paint: SkPaint;
  /** where in the flight this piece leaves, in milliseconds */
  launchMs: number;
  dx: number;
  dy: number;
  spin: number;
  distance: number;
  drop: number;
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
  origin,
  stagger,
  fallHeight,
  fallWidth,
}: {
  pieceCount: number;
  pieceColors: readonly [string, string];
  spread: number;
  pieceScale: number;
  origin: 'burst' | 'fall';
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
  const pieces = used.map((piece) => {
    const pieceWidth = piece.size * pieceScale;
    const pieceHeight = piece.size * 0.6 * pieceScale;
    widest = Math.max(widest, pieceWidth);

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
      distance: piece.distance * spread,
      drop: GRAVITY_DROP * spread,
      // The canvas is centred on the burst, so a fall runs from half its height
      // above the middle to half below, down a column picked by the piece's own
      // angle.
      column: piece.dx * (fallWidth / 2 - piece.size * 2),
      fallFrom: -fallHeight / 2 - piece.size * 2,
      fallTo: fallHeight / 2 + piece.size * 2,
    };
  });

  if (origin === 'fall') {
    return {
      width: fallWidth,
      height: fallHeight + widest * 4,
      pieces,
    };
  }

  // Square, and just big enough for the furthest a piece can get: Skia clips to
  // the canvas, so anything short of the full reach would cut the burst off
  // mid-flight.
  const reach = used.reduce(
    (furthest, piece) => Math.max(furthest, piece.distance * spread),
    0,
  );
  const size = (reach + GRAVITY_DROP * spread + widest) * 2;

  return { width: size, height: size, pieces };
}

export default Confetti;

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
