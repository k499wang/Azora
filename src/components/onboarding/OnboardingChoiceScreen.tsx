import OnboardingScreenLayout from './OnboardingScreenLayout';
import OnboardingPrimaryButton from './OnboardingPrimaryButton';
import OnboardingOptionList, {
  type OnboardingOption,
} from './OnboardingOptionList';
import MochiAside from './MochiAside';
import type { MochiExpression } from '../../features/room/MochiPortrait';

interface OnboardingChoiceScreenProps<Id extends string> {
  question: string;
  options: OnboardingOption<Id>[];
  selectedIds: Id[];
  stepIndex: number;
  stepCount: number;
  multiSelect?: boolean;
  expression?: MochiExpression;
  canContinue?: boolean;
  onSelect: (id: Id) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

/**
 * Mochi asks, the user picks one — the shape every plain question in the
 * assessment now takes. The screens that use it differ only in their copy and
 * their options, so they are configuration rather than components.
 */
export default function OnboardingChoiceScreen<Id extends string>({
  question,
  options,
  selectedIds,
  stepIndex,
  stepCount,
  multiSelect = false,
  expression = 'happy',
  canContinue = true,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: OnboardingChoiceScreenProps<Id>) {
  return (
    <OnboardingScreenLayout
      title=""
      titleSlot={
        <MochiAside
          text={question}
          variant="question"
          expression={expression}
          holding="notes"
          delayMs={160}
        />
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <OnboardingPrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={!canContinue}
        />
      }
    >
      <OnboardingOptionList
        options={options}
        selectedIds={selectedIds}
        multiSelect={multiSelect}
        onSelect={onSelect}
      />
    </OnboardingScreenLayout>
  );
}
