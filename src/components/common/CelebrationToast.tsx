import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import StreakFlame from './StreakFlame';
import { Text } from './Text';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { duration, easing, spring } from '../../theme/motion';

/** how long the bar sits on the screen before it leaves on its own */
const HOLD_MS = 2200;
/** the flame, sized to sit with the two lines of copy beside it */
const MARK_SIZE = 42;

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
      <StreakFlame size={MARK_SIZE} />
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
