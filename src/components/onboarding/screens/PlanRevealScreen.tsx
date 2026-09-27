import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LayoutAnimationConfig,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../common/Text';
import MindMapRadar from '../MindMapRadar';
import OnboardingProofStrip from '../OnboardingProofStrip';
import PlanOverview from '../PlanOverview';
import { colors } from '../../../theme/colors';
import { duration, easing } from '../../../theme/motion';
import { spacing } from '../../../theme/spacing';
import OnboardingScreenLayout, { onboardingTitleStyle } from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import type { MindMapScore } from '../../../lib/onboardingScores';
import type { OnboardingPreset } from '../../../lib/onboardingPreset';
import type { OnboardingIntent } from '../types';
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
  reasonEcho: string | null;
  triedEcho: string | null;
  lessonSubject: string;
  intent: OnboardingIntent;
  preset: OnboardingPreset;
}

const TITLES: Record<PlanRevealPhase, string> = {
  diagnosis: "See where you are, so you can build what's next",
  plan: 'Your personalized life reset plan',
};

const BUTTON_LABELS: Record<PlanRevealPhase, string> = {
  diagnosis: 'See my plan',
  plan: 'Start today’s step',
};

const PLAN_ENTER_DELAY_MS = 250;

/**
 * Both titles are always laid out, one over the other, and only faded. The
 * diagnosis title is the longer of the two and sits in flow, so the title
 * block keeps its height through the swap and the pentagon under it holds
 * still.
 */
function PhaseTitle({ phase }: { phase: PlanRevealPhase }) {
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
    <View>
      {(['diagnosis', 'plan'] as const).map((titlePhase) => {
        const hidden = titlePhase !== phase;
        return (
          <Animated.View
            key={titlePhase}
            style={[
              titlePhase === 'plan' && styles.overlaidTitle,
              titlePhase === 'plan' ? planStyle : diagnosisStyle,
            ]}
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
  reasonEcho,
  triedEcho,
  lessonSubject,
  intent,
  preset,
}: PlanRevealScreenProps) {
  const { width } = useWindowDimensions();
  // On the diagnosis step the pentagon is centred in the space it has. That
  // offset is kept for the plan step, where the page grows long and would
  // otherwise pull the pentagon up to the top.
  const [radarOffset, setRadarOffset] = useState(0);
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
        <View style={[styles.page, !isPlan && styles.pageFill]}>
          <View
            style={[
              styles.radarSlot,
              isPlan ? { paddingTop: radarOffset } : styles.radarSlotCentred,
            ]}
          >
            <View
              onLayout={(event) => {
                if (!isPlan) setRadarOffset(event.nativeEvent.layout.y);
              }}
            >
              <MindMapRadar
                scores={scores}
                targetScores={targetScores}
                showTarget={isPlan}
                size={Math.min(width, ONBOARDING_VISUAL_MAX_WIDTH)}
              />
            </View>
          </View>

          {isPlan ? (
            <Animated.View
              key="plan"
              entering={FadeInDown.delay(PLAN_ENTER_DELAY_MS).duration(duration.slow)}
              exiting={FadeOut.duration(duration.fast)}
            >
              <PlanOverview
                reasonEcho={reasonEcho}
                triedEcho={triedEcho}
                lessonSubject={lessonSubject}
                intent={intent}
                preset={preset}
              />
            </Animated.View>
          ) : (
            <Animated.View
              key="diagnosis"
              style={styles.proof}
              entering={FadeIn.delay(PLAN_ENTER_DELAY_MS).duration(duration.base)}
              exiting={FadeOut.duration(duration.fast)}
            >
              <OnboardingProofStrip />
            </Animated.View>
          )}
        </View>
      </LayoutAnimationConfig>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
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
  pageFill: {
    flex: 1,
  },
  // Bleeds into the layout's side gutters so the canvas is exactly the width it
  // was drawn for; the chips need that room at the screen edge.
  radarSlot: {
    alignItems: 'center',
    marginHorizontal: -spacing.lg,
  },
  radarSlotCentred: {
    flex: 1,
    justifyContent: 'center',
  },
  proof: {
    marginTop: spacing.xl,
  },
});
