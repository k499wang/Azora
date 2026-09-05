import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Easing } from 'react-native-reanimated';

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
   * Flight time of a single piece, with the launch stagger scaled to match. A
   * burst over something small wants both shorter — the pieces have less ground
   * to cover, and at the full duration they hang in the air after the moment
   * they were celebrating has passed.
   */
  durationMs?: number;
}

/**
 * A one-shot burst from the centre of whatever it is laid over. It fires on
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
  durationMs = PIECE_FLIGHT_MS,
}: ConfettiProps) {
  const renderedPieceCount = Number.isFinite(pieceCount)
    ? Math.max(0, Math.min(PIECES.length, Math.floor(pieceCount)))
    : DEFAULT_PIECE_COUNT;

  const stagger = durationMs / PIECE_FLIGHT_MS;
  const totalMs = durationMs + MAX_PIECE_DELAY * stagger;
  // Milliseconds since launch, so each piece can find its own place in the
  // flight without an animation of its own.
  const elapsed = useSharedValue(0);

  useEffect(() => {
    elapsed.value = 0;
    const start = setTimeout(() => {
      elapsed.value = withTiming(totalMs, {
        duration: totalMs,
        easing: Easing.linear,
      });
    }, startDelayMs);
    return () => clearTimeout(start);
  }, [elapsed, startDelayMs, totalMs]);

  const pieces = useMemo(
    () => PIECES.slice(0, renderedPieceCount),
    [renderedPieceCount],
  );

  return (
    <View pointerEvents="none" style={styles.layer}>
      {pieces.map((piece, index) => (
        <ConfettiPiece
          key={index}
          piece={piece}
          color={piece.size % 2 === 0 ? pieceColors[0] : pieceColors[1]}
          elapsed={elapsed}
          launchMs={piece.delay * stagger}
          durationMs={durationMs}
          spread={spread}
          pieceScale={pieceScale}
        />
      ))}
    </View>
  );
});

const ConfettiPiece = memo(function ConfettiPiece({
  piece,
  color,
  elapsed,
  launchMs,
  durationMs,
  spread,
  pieceScale,
}: {
  piece: (typeof PIECES)[number];
  color: string;
  elapsed: SharedValue<number>;
  launchMs: number;
  durationMs: number;
  spread: number;
  pieceScale: number;
}) {
  const distance = piece.distance * spread;
  const drop = GRAVITY_DROP * spread;
  const { dx, dy, spin } = piece;

  const style = useAnimatedStyle(() => {
    const linear = Math.min(
      1,
      Math.max(0, (elapsed.value - launchMs) / durationMs),
    );
    const fly = FLIGHT_EASING(linear);
    const travel = fly * distance;

    return {
      opacity:
        linear === 0
          ? 0
          : fly < 0.1
            ? fly * 10
            : fly > 0.75
              ? Math.max(0, 1 - (fly - 0.75) * 4)
              : 1,
      transform: [
        { translateX: dx * travel },
        // Gravity on the way out — pieces arc rather than shooting in
        // straight lines.
        { translateY: dy * travel + fly * drop },
        { rotate: `${fly * spin}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: piece.size * pieceScale,
          height: piece.size * 0.6 * pieceScale,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
});

export default Confetti;

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  piece: {
    position: 'absolute',
    borderRadius: 2,
  },
});
