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
  onSelect: (intentId: OnboardingIntent) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function IntentQuestionScreen({
  selectedIntents,
  isSubmitting,
  errorMessage,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
}: IntentQuestionScreenProps) {
  // The question takes one answer. A legacy profile can carry several goals at
  // once, and the list marks every id it is handed, so only the goal this
  // screen keeps is passed down.
  const selectedIntent = selectedIntents[0] ?? null;
  const canContinue = selectedIntent != null && !isSubmitting;

  return (
    <OnboardingScreenLayout
      title="What would you like to focus on right now?"
      subtitle="Pick whatever feels important. This won’t limit your access to any features."
      // the shared 40px section gap plus the list's own margin left this screen
      // with a 48px break under the subtitle; tighten it here only
      contentGap={spacing.md}
      progress={stepIndex / stepCount}
      onBack={onBack}
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
        selectedIds={selectedIntent == null ? [] : [selectedIntent]}
        onSelect={onSelect}
        disabled={isSubmitting}
        animate
        multiSelect={false}
        // This question waits for Continue, so the pick is held on screen with
        // the shared mark instead of advancing on tap.
        showSelectionMark
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
