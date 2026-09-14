import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { duration, easing, spring } from '../../theme/motion';
import { pressable } from '../../theme/pressable';
import { triggerTapHaptic } from '../../native/tapHaptics';

/** how far below its resting place the bar starts, in points */
const RISE = 96;

interface SurveyOfferNoticeProps {
  /** the offer was taken — the caller opens the survey */
  onPress: () => void;
  /** the bar has finished leaving, so the caller can stop rendering it */
  onDismiss: () => void;
}

/**
 * A grey bar that rises from the bottom of Home with a standing offer. Unlike
 * the celebration bar it waits rather than expiring: it leaves when it is
 * answered, closed, or pushed aside by something the app would rather say.
 */
export default function SurveyOfferNotice({
  onPress,
  onDismiss,
}: SurveyOfferNoticeProps) {
  const show = useSharedValue(0);

  useEffect(() => {
    show.value = withSpring(1, spring.pop);
    // Mount-only: the bar is rendered when there is an offer to make.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leave = () => {
    show.value = withTiming(
      0,
      { duration: duration.base, easing: easing.exit },
      (finished) => {
        if (finished) runOnJS(onDismiss)();
      },
    );
  };

  const style = useAnimatedStyle(() => ({
    opacity: show.value,
    transform: [{ translateY: (1 - show.value) * RISE }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Take a survey and get 50% off"
        onPress={() => {
          triggerTapHaptic();
          onPress();
          leave();
        }}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      >
        <Icon name="message" size={24} color={colors.notice.label} />
        <View style={styles.copy}>
          <Text style={styles.label}>Take a survey, get 50% off</Text>
          <Text style={styles.detail}>Takes about two minutes</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss this offer"
          hitSlop={spacing.md}
          onPress={() => {
            triggerTapHaptic();
            leave();
          }}
        >
          <Icon name="close" size={20} color={colors.notice.dismiss} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    backgroundColor: colors.notice.fill,
  },
  pressed: pressable.subtle,
  copy: {
    flex: 1,
  },
  label: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.notice.label,
  },
  detail: {
    ...typography.body.small,
    fontFamily: fonts.regular,
    color: colors.notice.detail,
  },
});
