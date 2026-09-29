import { useEffect, useRef } from 'react';
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
  /**
   * The moment it was last asked for. A new one while the bar is up restarts
   * its hold with the new copy in place — it does not rise again — so a run
   * of quick ticks is one bar that stays, not a bar rebuilt per tick.
   */
  stamp: number;
  /** Called once the bar has left, so the caller can unmount it. */
  onDone: () => void;
}

/**
 * A dark bar that rises over the page to confirm something landed, then leaves
 * on its own.
 */
export default function CelebrationToast({
  title,
  detail,
  stamp,
  onDone,
}: CelebrationToastProps) {
  const show = useSharedValue(0);
  // Held rather than depended on: the caller passes a fresh closure each render.
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    show.value = withSpring(1, spring.pop);
    const leave = setTimeout(() => {
      show.value = withTiming(0, {
        duration: duration.base,
        easing: easing.exit,
      });
    }, HOLD_MS);
    const gone = setTimeout(() => done.current(), HOLD_MS + duration.base);
    return () => {
      clearTimeout(leave);
      clearTimeout(gone);
    };
  }, [stamp, show]);

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
