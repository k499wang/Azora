import { StyleSheet, View } from 'react-native';
import InlineTimePicker from '../../common/InlineTimePicker';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface RoutineTimeScreenProps {
  title: string;
  subtitle: string;
  pickerTitle: string;
  value: string;
  stepIndex: number;
  stepCount: number;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function RoutineTimeScreen({
  title,
  subtitle,
  pickerTitle,
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
}: RoutineTimeScreenProps) {
  return (
    <OnboardingScreenLayout
      title={title}
      subtitle={subtitle}
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerBody
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
