import { useState } from 'react';
import OnboardingChoiceScreen from '../OnboardingChoiceScreen';
import type { StarterPlanItem } from '../../../lib/onboardingStarterPlan';

const MAX_HABIT_PICKS = 2;

const TOO_MANY_NOTICE =
  "Two is plenty to start. A new habit takes about 66 days to become automatic, and people who plan several at once follow through on fewer of them. Add more once these stick.";

interface HabitPicksScreenProps {
  question?: string;
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
  question = 'Which habits do you want to build?',
  items,
  selectedIds,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: HabitPicksScreenProps) {
  const [triedPastMax, setTriedPastMax] = useState(false);
  const atMax = selectedIds.length >= MAX_HABIT_PICKS;

  return (
    <OnboardingChoiceScreen
      question={question}
      expression="happy"
      options={items}
      selectedIds={selectedIds}
      multiSelect
      stepIndex={stepIndex}
      stepCount={stepCount}
      notice={triedPastMax && atMax ? TOO_MANY_NOTICE : null}
      onSelect={(id) => {
        if (atMax && !selectedIds.includes(id)) {
          setTriedPastMax(true);
          return;
        }
        setTriedPastMax(false);
        onSelect(id);
      }}
      onContinue={() => onContinue()}
      onBack={onBack}
      onSkip={onSkip}
    />
  );
}
