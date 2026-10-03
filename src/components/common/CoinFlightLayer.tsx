import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { InteractionManager, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Icon from './icons/Icon';
import { colors } from '../../theme/colors';

const COIN_SIZE = 22;
/** spread out of the tap, then the long pull to the pill */
const BURST_SHARE = 0.28;
const COIN_TRAVEL_MS = 760;
const COIN_STAGGER_MS = 45;
const BURST_MIN_RADIUS = 28;
const BURST_MAX_RADIUS = 64;
/** two +20 flights in the air at once, with room for a third to start */
const POOL_SIZE = 24;

/** when the first coin reaches the pill — what the pill waits before counting */
export const COIN_FLIGHT_MS = COIN_TRAVEL_MS;

interface Point {
  x: number;
  y: number;
}

interface CoinPath {
  from: Point;
  to: Point;
  burst: Point;
}

interface PooledCoinHandle {
  fire: (path: CoinPath, delayMs: number) => void;
}

export interface CoinFlightHandle {
  /** `from` is in window coordinates; without one the coins rise from mid-screen */
  launch: (earned: { coins: number; from?: Point }) => void;
}

interface Props {
  /** where the coins land, measured at launch so a scrolled header still lines up */
  targetRef: RefObject<View | null>;
}

function piecesFor(coins: number): number {
  return coins >= 20 ? 10 : 6;
}

function measure(view: View | null): Promise<{ x: number; y: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (view == null) {
      resolve(null);
      return;
    }
    view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
  });
}

function randomBurst(): Point {
  const angle = Math.random() * Math.PI * 2;
  const radius = BURST_MIN_RADIUS + Math.random() * (BURST_MAX_RADIUS - BURST_MIN_RADIUS);
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

/**
 * Coins that leave a finished to-do and fly to the balance pill.
 *
 * The coins are a fixed pool, mounted once the screen has settled and only ever
 * re-aimed: a launch writes shared values and renders nothing, so the frame the
 * tick lands on is not also building a dozen SVG views.
 */
const CoinFlightLayer = forwardRef<CoinFlightHandle, Props>(function CoinFlightLayer(
  { targetRef },
  ref,
) {
  const container = useRef<View>(null);
  const pool = useRef<(PooledCoinHandle | null)[]>([]);
  const nextSlot = useRef(0);
  const reducedMotion = useReducedMotion();
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => setArmed(true));
    return () => handle.cancel();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      launch: ({ coins, from }) => {
        if (reducedMotion) return;
        void Promise.all([measure(container.current), measure(targetRef.current)]).then(
          ([layer, target]) => {
            if (layer == null || target == null) return;
            const origin = from ?? {
              x: layer.x + layer.width / 2,
              y: layer.y + layer.height / 2,
            };
            const start = { x: origin.x - layer.x, y: origin.y - layer.y };
            // The coin mark sits at the pill's leading edge.
            const end = {
              x: target.x - layer.x + target.height / 2,
              y: target.y - layer.y + target.height / 2,
            };
            for (let index = 0; index < piecesFor(coins); index += 1) {
              const slot = nextSlot.current;
              nextSlot.current = (slot + 1) % POOL_SIZE;
              pool.current[slot]?.fire(
                { from: start, to: end, burst: randomBurst() },
                index * COIN_STAGGER_MS,
              );
            }
          },
        );
      },
    }),
    [reducedMotion, targetRef],
  );

  return (
    <View ref={container} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {armed
        ? Array.from({ length: POOL_SIZE }, (_, slot) => (
          <PooledCoin
            key={slot}
            ref={(handle) => {
              pool.current[slot] = handle;
            }}
          />
        ))
        : null}
    </View>
  );
});

export default CoinFlightLayer;

const RESTING_PATH: CoinPath = {
  from: { x: 0, y: 0 },
  to: { x: 0, y: 0 },
  burst: { x: 0, y: 0 },
};

const PooledCoin = forwardRef<PooledCoinHandle>(function PooledCoin(_, ref) {
  const path = useSharedValue<CoinPath>(RESTING_PATH);
  const progress = useSharedValue(1);

  useImperativeHandle(
    ref,
    () => ({
      fire: (next, delayMs) => {
        path.value = next;
        progress.value = 0;
        progress.value = withDelay(
          delayMs,
          withTiming(1, { duration: COIN_TRAVEL_MS, easing: Easing.linear }),
        );
      },
    }),
    [path, progress],
  );

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const { from, to, burst } = path.value;
    const startX = from.x + burst.x;
    const startY = from.y + burst.y;
    let x: number;
    let y: number;
    let scale: number;
    if (p < BURST_SHARE) {
      const t = 1 - Math.pow(1 - p / BURST_SHARE, 3);
      x = from.x + burst.x * t;
      y = from.y + burst.y * t;
      scale = 0.4 + 0.6 * t;
    } else {
      const t = Math.pow((p - BURST_SHARE) / (1 - BURST_SHARE), 2);
      // A quadratic curve bent toward the pill's row, so coins sweep up and over.
      const inverse = 1 - t;
      x = inverse * inverse * startX + 2 * inverse * t * startX + t * t * to.x;
      y = inverse * inverse * startY + 2 * inverse * t * to.y + t * t * to.y;
      scale = 1 - 0.3 * t;
    }
    return {
      opacity: p === 0 || p >= 1 ? 0 : 1,
      transform: [
        { translateX: x - COIN_SIZE / 2 },
        { translateY: y - COIN_SIZE / 2 },
        { scale },
      ],
    };
  });

  return (
    <Animated.View style={[styles.coin, style]}>
      <Icon name="coin" size={COIN_SIZE} color={colors.reward.gold} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  coin: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
