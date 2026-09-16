import { Text, TextInput } from '../../common/Text';
import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { triggerMediumHaptic } from '../../../native/tapHaptics';
import AzoAside from '../AzoAside';
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
  // The keyboard's done key commits the same answer the button does, so it gets
  // the same knock instead of landing silently. The button's own haptic comes
  // from `ChunkyButton`.
  const handleContinue = () => {
    triggerMediumHaptic();
    onContinue();
  };

  return (
    <OnboardingScreenLayout
      title=""
      titleSlot={
        <AzoAside
          text="Thanks for helping me out! Now, what should I call you?"
          variant="question"
          expression="curious"
          wearing="glasses"
          holding="notes"
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
        onSubmitEditing={handleContinue}
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
