/**
 * Picking the next plan, once the last one is finished.
 *
 * A row of cards rather than a stacked list: five plans down the page is a
 * form to work through, and the one thing this moment should not feel like is
 * admin. Sideways they are things to look at, and the page underneath —
 * insights, the weeks they just finished — stays reachable without scrolling
 * past a menu.
 *
 * Each card carries its own button. With a list, selecting and starting had to
 * be separate taps so the list could be browsed without committing; a card
 * that holds its own labelled Start has no such problem, and nothing commits
 * by being scrolled past.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import ChunkyButton from '../../components/common/ChunkyButton';
import PlanGeneratingBar from './PlanGeneratingBar';
import { planChoices, type PlanChoice } from './domain/planChoices';
import type { ProgramPlanId } from '../program/domain/programCatalogue';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/** Wide enough for the outcome to breathe, narrow enough that the next peeks. */
const CARD_WIDTH = 248;
const CARD_GAP = spacing.sm;

interface PlanChoicePickerProps {
  onStart: (planId: ProgramPlanId) => void;
  isStarting: boolean;
  hasFailed: boolean;
}

export default function PlanChoicePicker({
  onStart,
  isStarting,
  hasFailed,
}: PlanChoicePickerProps) {
  if (isStarting) {
    return (
      <View style={[card.base, card.shadow, styles.generating]}>
        <PlanGeneratingBar />
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        // Out to the screen edges and back again, so the first card lines up
        // with the title while the rest run off the side rather than stopping
        // short of it.
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {planChoices().map((choice) => (
          <ChoiceCard
            key={choice.planId}
            choice={choice}
            onStart={() => onStart(choice.planId)}
          />
        ))}
      </ScrollView>

      {hasFailed ? (
        <Text style={styles.failure}>
          That didn’t go through. Please try again.
        </Text>
      ) : null}
    </View>
  );
}

interface ChoiceCardProps {
  choice: PlanChoice;
  onStart: () => void;
}

function ChoiceCard({ choice, onStart }: ChoiceCardProps) {
  return (
    <View style={[card.base, card.shadow, styles.card]}>
      <View style={styles.copy}>
        <Text style={styles.territory}>{choice.territory}</Text>
        <Text style={styles.outcome}>{choice.outcome}</Text>
      </View>

      <Text style={styles.weeks}>{choice.weeks} weeks</Text>

      <ChunkyButton shape="card" label="Start" onPress={onStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -padding.screen.horizontal,
  },
  row: {
    paddingHorizontal: padding.screen.horizontal,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    padding: spacing.md,
    gap: spacing.sm,
  },
  copy: {
    gap: spacing.xs,
    // Holds every card to the same height whatever its outcome runs to, so
    // the buttons line up across the row.
    minHeight: 96,
  },
  territory: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  outcome: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  weeks: {
    ...typography.label.detail,
    color: colors.text.tertiary,
  },
  generating: {
    padding: spacing.lg,
  },
  failure: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingTop: spacing.sm,
  },
});
