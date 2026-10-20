import { StyleSheet, View } from 'react-native';
import Reanimated, { FadeIn, FadeOut } from 'react-native-reanimated';
import OnboardingScreenLayout from './OnboardingScreenLayout';
import OnboardingPrimaryButton from './OnboardingPrimaryButton';
import OnboardingOptionList, {
  type OnboardingOption,
} from './OnboardingOptionList';
import AzoAside from './AzoAside';
import type { AzoExpression } from '../../features/mascot/azoFace';
import { entranceTiming } from './entranceTiming';
import { Text } from '../common/Text';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface OnboardingChoiceScreenProps<Id extends string> {
  question: string;
  /** a quiet line under the question, for one people may hesitate to answer */
  note?: string;
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
  /** floats above Continue without moving anything beneath it */
  notice?: string | null;
  onSelect: (id: Id) => void;
  onContinue: (id?: Id) => void;
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
 * Multi-select Continue stays down until something is picked. Passing a question by leaving
 * it blank is what Skip is for, up by the progress bar: two ways past the same
 * screen would make Continue mean "answered" on one tap and "no answer" on the
 * next, and the plan would then be built from silences the user never chose.
 */
export default function OnboardingChoiceScreen<Id extends string>({
  question,
  note,
  expression = 'happy',
  options,
  selectedIds,
  stepIndex,
  stepCount,
  multiSelect = false,
  canContinue = true,
  notice,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: OnboardingChoiceScreenProps<Id>) {
  return (
    <OnboardingScreenLayout
      key={question}
      title=""
      titleSlot={
        <AzoAside
          text={question}
          note={note}
          variant="question"
          expression={expression}
          wearing="glasses"
          holding="notes"
          delayMs={entranceTiming.promptDelay}
        />
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={multiSelect ? (
        <View>
          {notice ? (
            <Reanimated.View
              entering={FadeIn.duration(duration.base)}
              exiting={FadeOut.duration(duration.fast)}
              pointerEvents="none"
              style={styles.notice}
            >
              <Text style={styles.noticeText}>{notice}</Text>
            </Reanimated.View>
          ) : null}
          <OnboardingPrimaryButton
            label="Continue"
            onPress={() => onContinue()}
            disabled={!canContinue || selectedIds.length === 0}
          />
        </View>
      ) : undefined}
    >
      <OnboardingOptionList
        options={options}
        selectedIds={selectedIds}
        multiSelect={multiSelect}
        onSelect={(id) => {
          if (!canContinue) return;
          onSelect(id);
        }}
        onAdvance={(id) => {
          if (canContinue) onContinue(id);
        }}
      />
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  notice: {
    ...card.base,
    ...card.shadow,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  noticeText: {
    ...typography.body.small,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
