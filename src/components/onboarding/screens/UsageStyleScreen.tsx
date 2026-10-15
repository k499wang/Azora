import { spacing } from '../../../theme/spacing';
import { USAGE_STYLE_OPTIONS, type UsageStyleId } from '../data/routineOptions';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionList from '../OnboardingOptionList';

interface UsageStyleScreenProps {
  selectedIds: UsageStyleId[];
  stepIndex: number;
  stepCount: number;
  onSelect: (id: UsageStyleId) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function UsageStyleScreen({
  selectedIds,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
}: UsageStyleScreenProps) {
  return (
    <OnboardingScreenLayout
      title="How do you want to use Azora?"
      subtitle="Pick all that apply. This won’t limit any features you get access to, and you can update it in Settings."
      contentGap={spacing.md}
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <OnboardingPrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={selectedIds.length === 0}
        />
      }
    >
      <OnboardingOptionList
        options={USAGE_STYLE_OPTIONS.map((option) => ({
          id: option.id,
          title: option.title,
          accent: option.accent,
          icon: option.icon,
        }))}
        selectedIds={selectedIds}
        onSelect={onSelect}
        animate
        multiSelect
        showSelectionMark
      />
    </OnboardingScreenLayout>
  );
}
