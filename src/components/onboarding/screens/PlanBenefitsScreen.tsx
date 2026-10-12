import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { onboardingPlanBenefits } from '../../../lib/onboardingPlanBenefits';
import type { OnboardingPreset } from '../../../lib/onboardingPreset';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import PopInWords from '../PopInWords';
import type { OnboardingIntent } from '../types';

export type PlanBenefitsPhase = 'outcome' | 'personalization';

interface PlanBenefitsScreenProps {
  phase: PlanBenefitsPhase;
  preset: OnboardingPreset;
  intent: OnboardingIntent;
  goalPhrase: string;
  triedEcho?: string | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const BUTTON_LABELS: Record<PlanBenefitsPhase, string> = {
  outcome: 'See how it fits me',
  personalization: 'Continue',
};

/**
 * The promise the plan makes, one line per phase and nothing else: each screen
 * is a single headline, read in the same word-by-word entrance as the story
 * beats. Each phase is freshly mounted by the onboarding flow.
 */
export default function PlanBenefitsScreen({
  phase,
  preset,
  intent,
  goalPhrase,
  triedEcho,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: PlanBenefitsScreenProps) {
  const benefits = onboardingPlanBenefits(preset, intent, goalPhrase, triedEcho);
  const reducedMotion = useReducedMotion();
  const headline = phase === 'outcome'
    ? `In ${benefits.days} days, you’ll feel ${benefits.outcome}.`
    : `A plan built around you.\nYour goal: ${benefits.goal}.`;
  const highlights = phase === 'outcome'
    ? [`${benefits.days} days`, benefits.outcome]
    : [benefits.goal];

  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerBody
      centerOnScreen
      footer={<OnboardingPrimaryButton label={BUTTON_LABELS[phase]} onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <PopInWords
          key={headline}
          text={headline}
          highlights={highlights}
          highlightStyle={styles.highlight}
          play
          reducedMotion={reducedMotion}
          textStyle={styles.headline}
        />
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignSelf: 'stretch',
    paddingVertical: spacing.lg,
  },
  headline: {
    ...typography.display.display3,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  highlight: { color: colors.primary.blue500 },
});
