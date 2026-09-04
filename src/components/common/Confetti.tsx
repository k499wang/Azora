import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { easing } from '../../theme/motion';

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
];

const DEFAULT_PIECE_COUNT = 12;
const PIECE_FLIGHT_MS = 1100;

interface ConfettiProps {
  /** Alternated piece to piece, so the burst reads as two-tone rather than flat. */
  pieceColors: readonly [string, string];
  /** Held before the first piece launches, to let the surface under it settle. */
  startDelayMs?: number;
  /** Number of pieces to render from the fixed choreography. */
  pieceCount?: number;
}

/**
 * A one-shot burst from the centre of whatever it is laid over. It fires on
 * mount and does not repeat, so remount it — via `key` or by mounting it with
 * the moment it celebrates — rather than looking for a replay control.
 */
const Confetti = memo(function Confetti({
  pieceColors,
  startDelayMs = 0,
  pieceCount = DEFAULT_PIECE_COUNT,
}: ConfettiProps) {
  const renderedPieceCount = Number.isFinite(pieceCount)
    ? Math.max(0, Math.min(PIECES.length, Math.floor(pieceCount)))
    : DEFAULT_PIECE_COUNT;

  return (
    <View pointerEvents="none" style={styles.layer}>
      {PIECES.slice(0, renderedPieceCount).map((piece, index) => (
        <ConfettiPiece
          key={index}
          piece={piece}
          color={piece.size % 2 === 0 ? pieceColors[0] : pieceColors[1]}
          startDelayMs={startDelayMs}
        />
      ))}
    </View>
  );
});

function ConfettiPiece({
  piece,
  color,
  startDelayMs,
}: {
  piece: (typeof PIECES)[number];
  color: string;
  startDelayMs: number;
}) {
  const fly = useSharedValue(0);
  const radians = (piece.angle * Math.PI) / 180;

  useEffect(() => {
    fly.value = withDelay(
      startDelayMs + piece.delay,
      withTiming(1, { duration: PIECE_FLIGHT_MS, easing: easing.burst }),
    );
  }, [fly, piece.delay, startDelayMs]);

  const style = useAnimatedStyle(() => {
    const travel = interpolate(fly.value, [0, 1], [0, piece.distance]);
    // Gravity on the way out — pieces arc rather than shooting in straight lines.
    const drop = interpolate(fly.value, [0, 1], [0, 90]);

    return {
      opacity: interpolate(fly.value, [0, 0.1, 0.75, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: Math.cos(radians) * travel },
        { translateY: Math.sin(radians) * travel + drop },
        { rotate: `${interpolate(fly.value, [0, 1], [0, piece.spin])}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        { width: piece.size, height: piece.size * 0.6, backgroundColor: color },
        style,
      ]}
    />
  );
}

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
