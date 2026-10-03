import { useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  cancelAnimation,
  useReducedMotion,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from './icons/Icon';
import StatChip, { type StatChipSize, type StatChipSurface } from './StatChip';
import { useCountUp } from '../../hooks/useCountUp';
import { triggerCoinSettleHaptic, triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { useWhileVisible } from '../../hooks/useWhileVisible';

const COUNT_MS_PER_COIN = 50;
/** every number shown is a render; a +10 counts in five, not ten */
const COUNT_STEP_MS = 100;
const COUNT_MAX_MS = 1200;
const POP_SCALE = 1.12;
const POP_MS = 90;

interface TopBarCoinsProps {
  /** undefined while the balance loads, so the first value lands without counting */
  coins: number | undefined;
  /** how long a gain waits before counting, so it ticks as the coins arrive */
  countUpDelayMs?: number;
  size?: StatChipSize;
  surface?: StatChipSurface;
}

export default function TopBarCoins({
  coins,
  countUpDelayMs = 0,
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
  // The final step always lands; drops and first loads stay silent, and a
  // count catching up on coins earned elsewhere pops without buzzing.
  const shown = useCountUp(coins, {
    delayMs: countUpDelayMs,
    msPerStep: COUNT_MS_PER_COIN,
    minStepMs: COUNT_STEP_MS,
    maxDurationMs: COUNT_MAX_MS,
    onStep: (_, landed, catchingUp) => {
      const now = Date.now();
      if (!landed && now - lastFeedbackAt.current < POP_MS * 2) return;
      lastFeedbackAt.current = now;
      if (!catchingUp) {
        if (landed) triggerCoinSettleHaptic();
        else triggerTapHaptic();
      }
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
          <Icon
            name="coin"
            size={size === 'compact' ? 22 : 30}
            color={colors.reward.gold}
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
