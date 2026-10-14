import OnboardingChoiceScreen from '../OnboardingChoiceScreen';
import type { StarterPlanItem } from '../../../lib/onboardingStarterPlan';

interface HabitPicksScreenProps {
  items: StarterPlanItem[];
  selectedIds: string[];
  stepIndex: number;
  stepCount: number;
  onSelect: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export default function HabitPicksScreen({
  items,
  selectedIds,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: HabitPicksScreenProps) {
  return (
    <OnboardingChoiceScreen
      question="Want to add any of these too?"
      expression="happy"
      options={items}
      selectedIds={selectedIds}
      multiSelect
      stepIndex={stepIndex}
      stepCount={stepCount}
      onSelect={onSelect}
      onContinue={() => onContinue()}
      onBack={onBack}
      onSkip={onSkip}
    />
  );
}
