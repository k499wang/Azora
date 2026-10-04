import { useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  cancelAnimation,
  useReducedMotion,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import TaskIllustration from './icons/TaskIllustration';
import StatChip, { type StatChipSize, type StatChipSurface } from './StatChip';
import { useCountUp } from '../../hooks/useCountUp';
import { triggerCoinSettleHaptic, triggerTapHaptic } from '../../native/tapHaptics';
import { useWhileVisible } from '../../hooks/useWhileVisible';

const COUNT_MS_PER_COIN = 50;
/** every number shown is a render; a +10 counts in five, not ten */
const COUNT_STEP_MS = 100;
const COUNT_MAX_MS = 1200;
const POP_SCALE = 1.12;
const POP_MS = 90;
/** shared by every pill, so a gain one screen counted lands still on the next */
const seenBalance: { current: number | undefined } = { current: undefined };

interface TopBarCoinsProps {
  /** undefined while the balance loads, so the first value lands without counting */
  coins: number | undefined;
  /**
   * How long a gain waits before counting, so it ticks as the coins fly in.
   * Without one nothing flies to this pill, and a gain lands at once.
   */
  countUpDelayMs?: number;
  size?: StatChipSize;
  surface?: StatChipSurface;
}

export default function TopBarCoins({
  coins,
  countUpDelayMs,
  size = 'regular',
  surface = 'glass',
}: TopBarCoinsProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const lastFeedbackAt = useRef(-Infinity);
  useWhileVisible(() => () => {
    cancelAnimation(scale);
    scale.value = 1;
  }, [scale]);
  // Keep feedback paced even when a large gain counts several coins per frame.
  // The final step always lands; drops and first loads stay silent.
  const shown = useCountUp(coins, {
    delayMs: countUpDelayMs ?? 0,
    counts: countUpDelayMs != null,
    msPerStep: COUNT_MS_PER_COIN,
    minStepMs: COUNT_STEP_MS,
    maxDurationMs: COUNT_MAX_MS,
    seen: seenBalance,
    onStep: (_, landed) => {
      const now = Date.now();
      if (!landed && now - lastFeedbackAt.current < POP_MS * 2) return;
      lastFeedbackAt.current = now;
      if (landed) triggerCoinSettleHaptic();
      else triggerTapHaptic();
      if (reducedMotion) return;
      scale.value = withSequence(
        withTiming(POP_SCALE, { duration: POP_MS }),
        withTiming(1, { duration: POP_MS }),
      );
    },
  });
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={popStyle}>
      <StatChip
        mark={
          <TaskIllustration
            name="coin"
            size={size === 'compact' ? 24 : 30}
          />
        }
        value={shown}
        accessibilityLabel={`${coins ?? shown} coins`}
        size={size}
        surface={surface}
      />
    </Animated.View>
  );
}
