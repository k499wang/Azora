/**
 * Picking the next plan, once the last one is finished.
 *
 * A row of cards rather than a stacked list: a growing plan catalogue is a
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
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import ChunkyButton from '../../components/common/ChunkyButton';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import PlanGeneratingBar from './PlanGeneratingBar';
import { planChoices, type PlanChoice } from './domain/planChoices';
import type { ProgramPlanId } from '../program/domain/programCatalogue';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/** Wide enough for the outcome to breathe, narrow enough that the next peeks. */
const CARD_WIDTH = 248;
const CARD_GAP = spacing.sm;

const PLAN_VISUALS: Record<ProgramPlanId, {
  icon: ComponentProps<typeof TaskIllustration>['name'];
  hue: { soft: string; ink: string };
}> = {
  night: { icon: 'moon', hue: colors.playful.violet },
  morning: { icon: 'sunrise', hue: colors.playful.amber },
  pressure: { icon: 'heart', hue: colors.playful.coral },
  focus: { icon: 'todo-focus-timer', hue: colors.playful.sky },
  quiet: { icon: 'lotus', hue: colors.playful.teal },
  home: { icon: 'home', hue: colors.playful.amber },
  phone: { icon: 'todo-screen-free', hue: colors.playful.sky },
  recovery: { icon: 'breath-leaf', hue: colors.playful.teal },
  selfTrust: { icon: 'sparkle', hue: colors.playful.blush },
};

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
  const { icon, hue } = PLAN_VISUALS[choice.planId];
  return (
    <View style={[card.base, styles.card, { backgroundColor: hue.soft }]}>
      <View style={styles.header}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <TaskIllustration name={icon} size={64} />
        </View>
        <View style={styles.duration}>
          <Text style={[styles.weeks, { color: hue.ink }]}>{choice.weeks} weeks</Text>
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.territory, { color: hue.ink }]}>{choice.territory}</Text>
        <Text style={[styles.outcome, { color: hue.ink }]}>{choice.outcome}</Text>
      </View>
      <ChunkyButton shape="card" label="Start this plan" onPress={onStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    // This row owns its content height inside a vertically scrolling page.
    flexGrow: 0,
    marginHorizontal: -padding.screen.horizontal,
  },
  row: {
    paddingHorizontal: padding.screen.horizontal,
    gap: CARD_GAP,
    paddingVertical: spacing.xs,
  },
  card: {
    width: CARD_WIDTH,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  duration: {
    backgroundColor: colors.onBlock.fill,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  copy: {
    gap: spacing.xs,
    // Holds every card to the same height whatever its outcome runs to, so
    // the buttons line up across the row.
    minHeight: 152,
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
