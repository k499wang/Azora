import { INTENT_OPTIONS } from '../data/intentOptions';
import { INTENT_ICONS } from '../data/intentOptionIcons';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingOptionList from '../OnboardingOptionList';
import type { OnboardingIntent } from '../types';

interface IntentPriorityScreenProps {
  selectedIntents: OnboardingIntent[];
  primaryIntent: OnboardingIntent | null;
  isSubmitting: boolean;
  stepIndex: number;
  stepCount: number;
  onSelect: (intentId: OnboardingIntent) => void;
  onContinue: (id: OnboardingIntent) => void;
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
  return (
    <OnboardingScreenLayout
      title="Which one is making life hardest right now?"
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={null}
    >
      <OnboardingOptionList
        options={options.map((option) => ({
          id: option.id,
          title: option.title,
          accent: option.accent,
          icon: INTENT_ICONS[option.id],
        }))}
        selectedIds={primaryIntent ? [primaryIntent] : []}
        onSelect={(id) => {
          if (isSubmitting) return;
          onSelect(id);
          onContinue(id);
        }}
        disabled={isSubmitting}
      />
    </OnboardingScreenLayout>
  );
}
