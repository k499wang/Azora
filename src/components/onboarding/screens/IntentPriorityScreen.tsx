import { INTENT_OPTIONS } from '../data/intentOptions';
import { INTENT_ICONS } from '../data/intentOptionIcons';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionList from '../OnboardingOptionList';
import type { OnboardingIntent } from '../types';

interface IntentPriorityScreenProps {
  selectedIntents: OnboardingIntent[];
  primaryIntent: OnboardingIntent | null;
  isSubmitting: boolean;
  stepIndex: number;
  stepCount: number;
  onSelect: (intentId: OnboardingIntent) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function IntentPriorityScreen({
  selectedIntents,
  primaryIntent,
  isSubmitting,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
}: IntentPriorityScreenProps) {
  const options = INTENT_OPTIONS.filter((option) =>
    selectedIntents.includes(option.id),
  );
  const canContinue =
    primaryIntent != null &&
    selectedIntents.includes(primaryIntent) &&
    !isSubmitting;

  return (
    <OnboardingScreenLayout
      title="What is most important to you?"
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
        options={options.map((option) => ({
          id: option.id,
          title: option.title,
          accent: option.accent,
          icon: INTENT_ICONS[option.id],
        }))}
        selectedIds={primaryIntent ? [primaryIntent] : []}
        onSelect={onSelect}
        disabled={isSubmitting}
      />
    </OnboardingScreenLayout>
  );
}

