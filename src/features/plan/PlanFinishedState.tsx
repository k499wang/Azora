/**
 * The moment a plan ends.
 *
 * Until this existed the plan simply stopped: the position line changed from
 * "Week 6 of 6" to "Every week done" and nothing else on the screen moved. A
 * finished course that acknowledges nothing is the most-reported complaint
 * about finishing anything in this category — see
 * `docs/plan-lifecycle-research.md` — and it lands at the exact week these
 * apps lose people.
 *
 * Restrained on purpose. It states what they did and what happens now, and
 * does not congratulate them in the app's own voice: the plan is theirs, and
 * the number is the compliment.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const MARK = 44;
const TICK = 24;

interface PlanFinishedStateProps {
  /** The plan they just finished, e.g. `The Azora Protocol`. */
  planName: string;
  totalWeeks: number;
}

export default function PlanFinishedState({
  planName,
  totalWeeks,
}: PlanFinishedStateProps) {
  return (
    <View style={styles.finished}>
      <View style={styles.mark}>
        <Icon name="check" size={TICK} color={colors.text.inverse} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>Your plan is finished</Text>
        <Text style={styles.body}>
          All {totalWeeks} weeks of {planName}. Home keeps your last day, so
          nothing disappears while you decide what’s next.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  finished: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  mark: {
    width: MARK,
    height: MARK,
    borderRadius: radius.full,
    backgroundColor: colors.playful.sky.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  body: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
