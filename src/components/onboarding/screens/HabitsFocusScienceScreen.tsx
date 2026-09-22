import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import TypedText from '../TypedText';

interface HabitsFocusScienceScreenProps {
  text: string;
  highlights: string[];
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

/** A short, plain-language aside between the assessment and the plan. */
export default function HabitsFocusScienceScreen({
  text,
  highlights,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: HabitsFocusScienceScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.body}>
        <TypedText text={text} highlights={highlights} style={styles.text} />
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    ...typography.display.display3,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
