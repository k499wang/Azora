import { StyleSheet } from 'react-native';
import { Text } from '../../common/Text';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingVisualIntro, {
  onboardingVisualEmphasis,
} from '../OnboardingVisualIntro';

interface SleepInsightScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function SleepInsightScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: SleepInsightScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <OnboardingVisualIntro
        image="azoSleeping"
        title={
          <>
            <Text style={styles.emphasis}>58%</Text> of people struggle with{' '}
            <Text style={styles.emphasis}>quality sleep</Text>.
          </>
        }
        subtitle="We’ll guide you into a calming bedtime routine, so winding down happens on its own and mornings start easier."
      />
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  emphasis: onboardingVisualEmphasis,
});
