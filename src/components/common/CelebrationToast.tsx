import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from './Text';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { duration, easing, spring } from '../../theme/motion';

/** how long the bar sits on the screen before it leaves on its own */
const HOLD_MS = 2200;
/**
 * The mark is a scatter of the same chips the burst throws — no disc, no badge,
 * so it reads as confetti caught mid-air rather than as an icon of confetti.
 * Fixed rather than random: the bar is chrome, and chrome that reshuffles
 * itself draws the eye away from the line it is carrying.
 */
const MARK_SIZE = 42;
interface MarkChip {
  top: number;
  left: number;
  width: number;
  height: number;
  rotate: number;
  color: string;
  round?: boolean;
}

const MARK_CHIPS: MarkChip[] = [
  { top: 2, left: 14, width: 10, height: 5, rotate: -28, color: colors.reward.gold },
  { top: 11, left: 1, width: 8, height: 5, rotate: 24, color: colors.primary.blue400 },
  { top: 14, left: 26, width: 7, height: 7, rotate: 14, color: colors.success[500], round: true },
  { top: 24, left: 9, width: 11, height: 5, rotate: -12, color: colors.reward.flame },
  { top: 31, left: 28, width: 8, height: 5, rotate: 38, color: colors.primary.blue600 },
  { top: 33, left: 0, width: 6, height: 6, rotate: 0, color: colors.success[300], round: true },
];

interface CelebrationToastProps {
  title: string;
  detail?: string;
  /** Called once the bar has left, so the caller can unmount it. */
  onDone: () => void;
}

/**
 * A dark bar that rises over the page to confirm something landed, then leaves
 * on its own. One-shot: it plays on mount and does not repeat, so remount it
 * via `key` for the next thing worth confirming.
 */
export default function CelebrationToast({
  title,
  detail,
  onDone,
}: CelebrationToastProps) {
  const show = useSharedValue(0);

  useEffect(() => {
    show.value = withSpring(1, spring.pop);
    const leave = setTimeout(() => {
      show.value = withTiming(0, {
        duration: duration.base,
        easing: easing.exit,
      });
    }, HOLD_MS);
    const done = setTimeout(() => onDone(), HOLD_MS + duration.base);
    return () => {
      clearTimeout(leave);
      clearTimeout(done);
    };
    // Mount-only: the bar is keyed by the moment it celebrates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: show.value,
    transform: [{ translateY: (1 - show.value) * 28 }],
  }));

  return (
    <Animated.View style={[styles.bar, style]} pointerEvents="none">
      <View style={styles.mark}>
        {MARK_CHIPS.map((chip, index) => (
          <View
            key={index}
            style={[
              styles.markChip,
              {
                top: chip.top,
                left: chip.left,
                width: chip.width,
                height: chip.height,
                borderRadius: chip.round ? radius.full : 2,
                backgroundColor: chip.color,
                transform: [{ rotate: `${chip.rotate}deg` }],
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {detail == null ? null : (
          <Text style={styles.detail} numberOfLines={2}>
            {detail}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.toast.fill,
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
  },
  markChip: {
    position: 'absolute',
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.toast.title,
  },
  detail: {
    ...typography.body.medium,
    fontFamily: fonts.regular,
    color: colors.toast.detail,
  },
});
