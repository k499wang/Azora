import { Text, TextInput } from '../../common/Text';
import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import MochiAside from '../MochiAside';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface NameScreenProps {
  value: string;
  stepIndex: number;
  stepCount: number;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export default function NameScreen({
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: NameScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      titleSlot={
        <MochiAside
          text="Thanks for helping me out! Now, what should I call you?"
          variant="question"
          delayMs={160}
        />
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      keyboardAvoiding
      footer={
        <OnboardingPrimaryButton label="Continue" onPress={onContinue} />
      }
    >
      <TextInput
        accessibilityLabel="Your name"
        autoCapitalize="words"
        autoCorrect={false}
        autoFocus
        maxLength={40}
        onChangeText={onChange}
        onSubmitEditing={onContinue}
        placeholder="First name (optional)"
        placeholderTextColor={colors.text.tertiary}
        returnKeyType="done"
        style={styles.input}
        value={value}
      />
      <Text style={styles.hint}>You can leave this blank.</Text>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 16,
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.md,
    ...typography.input.text,
    lineHeight: undefined,
    color: colors.text.primary,
  },
  hint: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
});
