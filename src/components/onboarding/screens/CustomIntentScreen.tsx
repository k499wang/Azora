import { Text, TextInput } from '../../common/Text';
import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface CustomIntentScreenProps {
  value: string;
  stepIndex: number;
  stepCount: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function CustomIntentScreen({
  value,
  stepIndex,
  stepCount,
  isSubmitting,
  errorMessage,
  onChange,
  onContinue,
  onBack,
}: CustomIntentScreenProps) {
  const canContinue = value.trim().length > 0 && !isSubmitting;

  return (
    <OnboardingScreenLayout
      title="What brought you here?"
      subtitle="Share the goal, feeling, or situation you want Azora to support."
      progress={stepIndex / stepCount}
      onBack={onBack}
      keyboardAvoiding
      footer={
        <OnboardingPrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={!canContinue}
          loading={isSubmitting}
        />
      }
    >
      <TextInput
        accessibilityLabel="What brought you here"
        autoCapitalize="sentences"
        autoCorrect
        editable={!isSubmitting}
        multiline
        onChangeText={onChange}
        placeholder="Example: I want to calm down before presentations."
        placeholderTextColor={colors.text.tertiary}
        returnKeyType="done"
        style={styles.input}
        textAlignVertical="top"
        value={value}
      />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 156,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.input.text,
    color: colors.text.primary,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
});
