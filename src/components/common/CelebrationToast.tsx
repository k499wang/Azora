import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import StreakFlame from './StreakFlame';
import { Text } from './Text';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { duration, easing } from '../../theme/motion';

/** the flame, sized to sit with the two lines of copy beside it */
const MARK_SIZE = 42;

interface CelebrationToastProps {
  title: string;
  detail?: string;
  visible: boolean;
}

/**
 * A dark bar over the page to confirm something landed.
 *
 * Repeated ticks swap the copy without replaying the entrance. Hidden content
 * is removed so an unrelated update cannot restore a settled native opacity.
 */
function CelebrationToast({ title, detail, visible }: CelebrationToastProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = reducedMotion ? Number(visible) : withTiming(Number(visible), {
      duration: duration.fast,
      easing: visible ? easing.enter : easing.exit,
    });
    return () => cancelAnimation(progress);
  }, [visible, reducedMotion, progress]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reducedMotion ? 0 : (1 - progress.value) * spacing.sm }],
  }));
  if (!visible) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.bar, animatedStyle]}
    >
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

export default memo(CelebrationToast);

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
