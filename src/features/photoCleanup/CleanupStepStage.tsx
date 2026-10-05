import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing, travel } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import AzoPortrait from '../mascot/AzoPortrait';

type CleanupStepStageProps = {
  instruction: string;
  subtitle: string;
  milestone: string | null;
  slideKey: number;
  active: boolean;
};

export default function CleanupStepStage({ instruction, subtitle, milestone, slideKey, active }: CleanupStepStageProps) {
  const reducedMotion = useReducedMotion();
  const stepEntrance = useSharedValue(1);

  useWhileVisible(() => {
    if (active && !reducedMotion) {
      stepEntrance.value = 0;
      stepEntrance.value = withTiming(1, { duration: duration.slow, easing: easing.enter });
    } else {
      stepEntrance.value = 1;
    }
    return () => {
      cancelAnimation(stepEntrance);
      stepEntrance.value = 1;
    };
  }, [active, reducedMotion, slideKey, stepEntrance]);

  const bubbleAnimation = useAnimatedStyle(() => ({
    opacity: stepEntrance.value,
    transform: [
      { translateY: reducedMotion ? 0 : travel.rise * (1 - stepEntrance.value) },
      { scale: reducedMotion ? 1 : 0.97 + 0.03 * stepEntrance.value },
    ],
  }));
  const subtitleAnimation = useAnimatedStyle(() => ({ opacity: stepEntrance.value }));
  return (
    <View style={styles.stepStage}>
      <View style={styles.azoStage}>
        <Animated.View style={[styles.speechBubble, bubbleAnimation]}>
          <View style={styles.speechTail} />
          <Text style={styles.instruction}>{instruction}</Text>
        </Animated.View>
        <AzoPortrait size={144} active={active} />
      </View>
      <View style={styles.stepFooter}>
        <Animated.View style={subtitleAnimation} accessibilityLiveRegion="polite">
          <Text style={styles.subtitle}>{milestone ?? subtitle}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepStage: { flex: 1, minHeight: 320, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  azoStage: { alignItems: 'center', alignSelf: 'stretch' },
  stepFooter: { minHeight: 48, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  speechBubble: {
    position: 'relative', zIndex: 1, width: '100%', maxWidth: 300, minHeight: 120,
    justifyContent: 'center', marginBottom: -spacing.xs, paddingHorizontal: spacing.lg,
    paddingTop: spacing.md, paddingBottom: spacing.md + 3, borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth, borderBottomWidth: 3,
    borderColor: colors.border.subtle, borderBottomColor: colors.neutral[200],
    backgroundColor: colors.background.card,
  },
  speechTail: {
    position: 'absolute', zIndex: -1, bottom: -8, left: '50%', width: 16, height: 16,
    marginLeft: -8, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle, backgroundColor: colors.background.card, transform: [{ rotate: '45deg' }],
  },
  instruction: { ...typography.title.title1, fontFamily: fonts.semibold, textAlign: 'center', color: colors.text.primary },
  subtitle: { ...typography.body.small, textAlign: 'center', color: colors.text.secondary },
});
