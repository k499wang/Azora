import { StyleSheet } from 'react-native';
import { Text } from '../../common/Text';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingVisualIntro, {
  onboardingVisualEmphasis,
} from '../OnboardingVisualIntro';

interface PiecesTogetherScreenProps {
  subtitle: string;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function PiecesTogetherScreen({
  subtitle,
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
        subtitle={subtitle}
      />
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  emphasis: onboardingVisualEmphasis,
});
