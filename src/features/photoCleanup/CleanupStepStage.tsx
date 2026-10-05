import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing, spring, travel } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import AzoPortrait from '../mascot/AzoPortrait';

type CleanupStepStageProps = {
  instruction: string;
  subtitle: string;
  milestone: string | null;
  slideKey: number;
  active: boolean;
  finishPhase: 'idle' | 'holding' | 'fading';
};

function FinishedCheck({ active }: { active: boolean }) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : 0.6);
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useWhileVisible(() => {
    if (active && !reducedMotion) {
      scale.value = 0.6;
      opacity.value = 0;
      scale.value = withSpring(1, spring.snap);
      opacity.value = withTiming(1, { duration: duration.fast, easing: easing.enter });
    } else {
      scale.value = 1;
      opacity.value = 1;
    }
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [active, reducedMotion, scale, opacity]);

  const animation = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.finishedCheck, animation]} accessibilityLabel="Item finished">
      <Icon name="check" size={22} color={colors.success[700]} />
    </Animated.View>
  );
}

export default function CleanupStepStage({ instruction, subtitle, milestone, slideKey, active, finishPhase }: CleanupStepStageProps) {
  const reducedMotion = useReducedMotion();
  const stepEntrance = useSharedValue(1);

  useWhileVisible(() => {
    if (!active || reducedMotion || finishPhase === 'holding') {
      stepEntrance.value = 1;
    } else if (finishPhase === 'fading') {
      stepEntrance.value = withTiming(0, { duration: duration.fast, easing: easing.exit });
    } else {
      stepEntrance.value = 0;
      stepEntrance.value = withTiming(1, { duration: duration.slow, easing: easing.enter });
    }
    return () => {
      cancelAnimation(stepEntrance);
      stepEntrance.value = 1;
    };
  }, [active, reducedMotion, slideKey, stepEntrance, finishPhase]);

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
        <View style={styles.instructionSlot}>
          <Animated.View style={[styles.speechBubble, bubbleAnimation]}>
            <View style={styles.speechTail} />
            {finishPhase === 'idle' ? null : <FinishedCheck active={active} />}
            <Text style={styles.instruction} numberOfLines={4} adjustsFontSizeToFit>{instruction}</Text>
          </Animated.View>
        </View>
        <AzoPortrait size={200} active={active} />
      </View>
      <View style={styles.stepFooter}>
        <Animated.View style={[styles.encouragement, subtitleAnimation]} accessibilityLiveRegion="polite">
          <View style={styles.subtitleAccent} />
          <Text style={styles.subtitle}>{milestone ?? subtitle}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepStage: { flex: 1, minHeight: 320, alignItems: 'center', justifyContent: 'center' },
  azoStage: { alignItems: 'center', alignSelf: 'stretch' },
  // Fixed slots keep copy length from moving Azo or the controls between steps.
  instructionSlot: { height: 180, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'flex-end' },
  stepFooter: { height: 180, alignSelf: 'stretch', alignItems: 'center', paddingTop: spacing.md },
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
  finishedCheck: {
    position: 'absolute', top: -spacing.md, right: spacing.md,
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success[100],
  },
  encouragement: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  subtitleAccent: { width: 28, height: 3, borderRadius: radius.large, backgroundColor: colors.primary.blue300 },
  subtitle: { ...typography.body.large, fontFamily: fonts.semibold, textAlign: 'center', color: colors.primary.blue900 },
});
