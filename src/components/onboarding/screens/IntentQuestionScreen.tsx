import { Text } from '../../common/Text';
import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { INTENT_OPTIONS } from '../data/intentOptions';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionList from '../OnboardingOptionList';
import { INTENT_ICONS } from '../data/intentOptionIcons';
import type { OnboardingIntent } from '../types';

interface IntentQuestionScreenProps {
  selectedIntents: OnboardingIntent[];
  isSubmitting: boolean;
  errorMessage: string | null;
  stepIndex: number;
  stepCount: number;
  onToggle: (intentId: OnboardingIntent) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function IntentQuestionScreen({
  selectedIntents,
  isSubmitting,
  errorMessage,
  stepIndex,
  stepCount,
  onToggle,
  onContinue,
  onBack,
}: IntentQuestionScreenProps) {
  const canContinue = selectedIntents.length > 0 && !isSubmitting;

  return (
    <OnboardingScreenLayout
      title="What's on your mind?"
      progress={stepIndex / stepCount}
      onBack={onBack}
      animateCopy
      footer={
        <OnboardingPrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={!canContinue}
          loading={isSubmitting}
        />
      }
    >
      <OnboardingOptionList
        options={INTENT_OPTIONS.map((option) => ({
          id: option.id,
          title: option.title,
          accent: option.accent,
          icon: INTENT_ICONS[option.id],
        }))}
        selectedIds={selectedIntents}
        onSelect={onToggle}
        disabled={isSubmitting}
        animate
        multiSelect
      />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.body.small,
    color: colors.error[700],
    marginTop: spacing.sm,
  },
});
