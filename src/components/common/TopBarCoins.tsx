import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from './icons/Icon';
import StatChip, { type StatChipSize, type StatChipSurface } from './StatChip';
import { useCountUp } from '../../hooks/useCountUp';
import { triggerCoinSettleHaptic, triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';

const COUNT_MS_PER_COIN = 50;
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
  // Every step clicks like a detent and the last one knocks, so a gain is felt
  // counting in and then landing. A drop or the first load moves in one jump
  // and stays silent.
  const shown = useCountUp(coins, {
    delayMs: countUpDelayMs,
    msPerStep: COUNT_MS_PER_COIN,
    maxDurationMs: COUNT_MAX_MS,
    onStep: (_, landed) => {
      if (landed) triggerCoinSettleHaptic();
      else triggerTapHaptic();
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
