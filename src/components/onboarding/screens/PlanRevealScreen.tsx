import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  LayoutAnimationConfig,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../common/Text';
import MindMapRadar from '../MindMapRadar';
import OnboardingProofStrip from '../OnboardingProofStrip';
import { colors } from '../../../theme/colors';
import { duration, easing } from '../../../theme/motion';
import { spacing } from '../../../theme/spacing';
import OnboardingScreenLayout, { onboardingTitleStyle } from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import type { MindMapScore } from '../../../lib/onboardingScores';
import { ONBOARDING_VISUAL_MAX_WIDTH } from '../onboardingVisualScale';

export type PlanRevealPhase = 'diagnosis' | 'plan';

interface PlanRevealScreenProps {
  /**
   * Two onboarding steps share this screen so the pentagon stays mounted
   * between them: flipping the phase grows the goal in place and swaps what
   * sits around it, instead of fading one screen out and another in.
   */
  phase: PlanRevealPhase;
  scores: MindMapScore[];
  targetScores: MindMapScore[];
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const TITLES: Record<PlanRevealPhase, string> = {
  diagnosis: "Here's where you are today",
  plan: "Here's where you'll be after your plan",
};

const BUTTON_LABELS: Record<PlanRevealPhase, string> = {
  diagnosis: 'See my plan',
  plan: 'Continue',
};

const PROOF_ENTER_DELAY_MS = 250;

/**
 * Both titles are always laid out, one over the other, and only faded. The
 * block takes the taller one's height, so it keeps its size through the swap
 * and the pentagon under it holds still.
 */
function PhaseTitle({ phase }: { phase: PlanRevealPhase }) {
  const [heights, setHeights] = useState<Record<PlanRevealPhase, number>>({
    diagnosis: 0,
    plan: 0,
  });
  const reducedMotion = useReducedMotion();
  const shown = useSharedValue(phase === 'plan' ? 1 : 0);

  useEffect(() => {
    const to = phase === 'plan' ? 1 : 0;
    shown.value = reducedMotion
      ? to
      : withTiming(to, { duration: duration.slow, easing: easing.enter });
  }, [phase, reducedMotion, shown]);

  const diagnosisStyle = useAnimatedStyle(() => ({ opacity: 1 - shown.value }));
  const planStyle = useAnimatedStyle(() => ({ opacity: shown.value }));

  return (
    <View style={{ minHeight: Math.max(heights.diagnosis, heights.plan) }}>
      {(['diagnosis', 'plan'] as const).map((titlePhase) => {
        const hidden = titlePhase !== phase;
        return (
          <Animated.View
            key={titlePhase}
            style={[styles.overlaidTitle, titlePhase === 'plan' ? planStyle : diagnosisStyle]}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setHeights((current) =>
                current[titlePhase] === height ? current : { ...current, [titlePhase]: height },
              );
            }}
            accessibilityElementsHidden={hidden}
            importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
          >
            <Text style={[onboardingTitleStyle, styles.title]}>{TITLES[titlePhase]}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

export default function PlanRevealScreen({
  phase,
  scores,
  targetScores,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: PlanRevealScreenProps) {
  const { width } = useWindowDimensions();
  const isPlan = phase === 'plan';

  return (
    <OnboardingScreenLayout
      title={TITLES[phase]}
      titleSlot={<PhaseTitle phase={phase} />}
      progress={stepIndex / stepCount}
      onBack={onBack}
      scrollResetKey={phase}
      footer={<OnboardingPrimaryButton label={BUTTON_LABELS[phase]} onPress={onContinue} />}
    >
      <LayoutAnimationConfig skipEntering>
        <View style={styles.page}>
          <View style={styles.radarSlot}>
            <MindMapRadar
              scores={scores}
              targetScores={targetScores}
              showTarget={isPlan}
              size={Math.min(width, ONBOARDING_VISUAL_MAX_WIDTH)}
            />
          </View>

          <Animated.View
            style={styles.proof}
            entering={FadeIn.delay(PROOF_ENTER_DELAY_MS).duration(duration.base)}
          >
            <OnboardingProofStrip />
          </Animated.View>
        </View>
      </LayoutAnimationConfig>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  proof: {
    marginTop: spacing.lg,
  },
  title: {
    fontSize: 32,
    lineHeight: 39,
    letterSpacing: -0.5,
    color: colors.text.primary,
  },
  overlaidTitle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  page: {
    gap: spacing.sm,
  },
  // Bleeds into the layout's side gutters so the canvas is exactly the width it
  // was drawn for; the chips need that room at the screen edge. Pulled up into
  // the layout's title gap, since the top chip already carries its own space.
  // Top-aligned on both steps, so the pentagon sits at the same height on each.
  radarSlot: {
    alignItems: 'center',
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.xs,
  },
});
