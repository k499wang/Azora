import { StyleSheet, View } from 'react-native';
import MindMapRings from '../MindMapRings';
import OnboardingProofStrip from '../OnboardingProofStrip';
import { spacing } from '../../../theme/spacing';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import type { MindMapScore } from '../../../lib/onboardingScores';

interface DiagnosisScreenProps {
  scores: MindMapScore[];
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function DiagnosisScreen({
  scores,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: DiagnosisScreenProps) {
  return (
    <OnboardingScreenLayout
      title="See where you are, so you can build what's next"
      progress={stepIndex / stepCount}
      onBack={onBack}
      titleStyle={styles.screenTitle}
      centerCopy
      footer={<OnboardingPrimaryButton label="See my plan" onPress={onContinue} />}
    >
      <View style={styles.page}>
        <MindMapRings scores={scores} />

        <View style={styles.proof}>
          <OnboardingProofStrip />
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 32,
    lineHeight: 39,
    letterSpacing: -0.5,
  },
  page: {
    gap: spacing.sm,
  },
  proof: {
    marginTop: spacing.xl,
  },
});
