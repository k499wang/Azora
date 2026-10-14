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
            Sleep is often{' '}
            <Text style={styles.emphasis}>the first thing to slip</Text>.
          </>
        }
        subtitle="We’ll help you make winding down feel a little less like another thing to manage."
      />
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  emphasis: onboardingVisualEmphasis,
});
