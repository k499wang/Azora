import { entranceTiming } from '../entranceTiming';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import type { AzoExpression } from '../../../features/mascot/azoFace';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingHapticSlider from '../OnboardingHapticSlider';
import AzoAside from '../AzoAside';
import { SLIDER_MAX, SLIDER_MIN } from '../data/sliderAnswers';

interface SliderQuestionScreenProps {
  question: string;
  expression: AzoExpression;
  /** which end of the scale is the good one, so the colour warms the right way */
  higherIsBetter: boolean;
  minLabel: string;
  maxLabel: string;
  value: number;
  stepIndex: number;
  stepCount: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

function accentForWellbeing(value: number): string {
  if (value <= 2) return colors.error[500];
  if (value <= 4) return colors.orange[500];
  if (value <= 6) return colors.warning[500];
  if (value <= 8) return colors.primary.blue500;
  return colors.success[500];
}

/** Azo asks, the user drags a 1–9 scale between two first-person ends. */
export default function SliderQuestionScreen({
  question,
  expression,
  higherIsBetter,
  minLabel,
  maxLabel,
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: SliderQuestionScreenProps) {
  const accent = accentForWellbeing(higherIsBetter ? value : SLIDER_MAX + SLIDER_MIN - value);

  return (
    <OnboardingScreenLayout
      title=""
      titleSlot={
        <AzoAside
          text={question}
          variant="question"
          expression={expression}
          wearing="glasses"
          holding="notes"
          delayMs={entranceTiming.promptDelay}
        />
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      centerBody
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.content}>
        <OnboardingHapticSlider
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          value={value}
          accent={accent}
          onChange={onChange}
          minLabel={minLabel}
          maxLabel={maxLabel}
        />
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
});
