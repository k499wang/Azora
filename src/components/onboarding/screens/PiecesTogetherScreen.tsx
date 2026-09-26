import { StyleSheet } from 'react-native';
import { Text } from '../../common/Text';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingVisualIntro, {
  onboardingVisualEmphasis,
} from '../OnboardingVisualIntro';

interface PiecesTogetherScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function PiecesTogetherScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: PiecesTogetherScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <OnboardingVisualIntro
        image="azoPuzzle"
        title={
          <>
            Azora puts <Text style={styles.emphasis}>all the pieces</Text>{' '}
            together.
          </>
        }
        subtitle="Whether it’s stress, a messy space, or low energy, we’ll help you fix what matters most, one small step a day."
      />
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  emphasis: onboardingVisualEmphasis,
});
