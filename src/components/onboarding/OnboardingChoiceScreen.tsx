import OnboardingScreenLayout from './OnboardingScreenLayout';
import OnboardingPrimaryButton from './OnboardingPrimaryButton';
import OnboardingOptionList, {
  type OnboardingOption,
} from './OnboardingOptionList';
import AzoAside from './AzoAside';
import type { AzoExpression } from '../../features/mascot/azoFace';

interface OnboardingChoiceScreenProps<Id extends string> {
  question: string;
  /** which attentive face he asks it with; see the note above */
  expression?: AzoExpression;
  options: OnboardingOption<Id>[];
  selectedIds: Id[];
  stepIndex: number;
  stepCount: number;
  multiSelect?: boolean;
  /**
   * An extra condition on top of having answered — a screen that is still
   * saving, say. It can only ever tighten the gate, never open it.
   */
  canContinue?: boolean;
  onSelect: (id: Id) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

/**
 * Azo asks, the user picks one — the shape every plain question in the
 * assessment now takes. The screens that use it differ only in their copy and
 * their options, so they are configuration rather than components.
 *
 * He asks every one of them in the same glasses, holding the same clipboard,
 * and the face varies only in attention, never in reaction: `happy`, `curious`,
 * `listening`, `thinking`. A question screen is the user's turn, not his — a
 * mascot who pulls a new emotion for each one is reacting to an answer he has
 * not been given yet — but one frozen in a single frame for thirty screens
 * stops reading as alive, so where he looks and how far his lids are down move
 * between them.
 *
 * Continue stays down until something is picked. Passing a question by leaving
 * it blank is what Skip is for, up by the progress bar: two ways past the same
 * screen would make Continue mean "answered" on one tap and "no answer" on the
 * next, and the plan would then be built from silences the user never chose.
 */
export default function OnboardingChoiceScreen<Id extends string>({
  question,
  expression = 'happy',
  options,
  selectedIds,
  stepIndex,
  stepCount,
  multiSelect = false,
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
        <AzoAside
          text={question}
          variant="question"
          expression={expression}
          wearing="glasses"
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
          disabled={!canContinue || selectedIds.length === 0}
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
