import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import PopInWords from '../PopInWords';

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
  const reducedMotion = useReducedMotion();
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.body}>
        <PopInWords
          key={text}
          text={text}
          highlights={highlights}
          highlightStyle={styles.highlight}
          play
          reducedMotion={reducedMotion}
          textStyle={styles.text}
        />
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
  highlight: { color: colors.primary.blue500 },
});
