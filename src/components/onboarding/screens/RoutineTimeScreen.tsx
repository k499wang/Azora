import { StyleSheet, useWindowDimensions, View } from 'react-native';
import InlineTimePicker from '../../common/InlineTimePicker';
import { isShortScreen } from '../../../theme/breakpoints';
import AzoAside from '../AzoAside';
import { entranceTiming } from '../entranceTiming';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface RoutineTimeScreenProps {
  /** Asked by Azo, in his speech bubble. */
  question: string;
  pickerTitle: string;
  value: string;
  stepIndex: number;
  stepCount: number;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function RoutineTimeScreen({
  question,
  pickerTitle,
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
}: RoutineTimeScreenProps) {
  const { height } = useWindowDimensions();
  const compact = isShortScreen(height);

  return (
    <OnboardingScreenLayout
      title=""
      titleSlot={
        <AzoAside
          text={question}
          variant="question"
          expression="curious"
          wearing="glasses"
          holding="notes"
          delayMs={entranceTiming.promptDelay}
        />
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerBody={!compact}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.content}>
        <InlineTimePicker
          value={value}
          onChange={onChange}
          accessibilityLabel={pickerTitle}
        />
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'stretch',
  },
});
