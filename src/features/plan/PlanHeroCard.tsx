import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import ArcGauge from '../../components/common/ArcGauge';
import Skeleton from '../../components/common/Skeleton';
import {
  azoraScoreDetail,
  azoraScoreIfTodayKept,
  type AzoraScore,
} from './domain/azoraScore';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const GAUGE_SIZE = 264;
/**
 * About a sixteenth of the diameter.
 *
 * The arc is a scale rather than the content: the number inside it is what the
 * card is for, and a stroke at a tenth of the diameter was heavy enough to
 * compete with it. Thin enough to read as a dial, thick enough not to read as
 * a spinner that has stopped.
 */
const GAUGE_STROKE = 16;
const VALUE_SIZE = 64;
const VALUE_LINE_HEIGHT = 70;
/**
 * How much taller the square that draws the arc is than the arc itself.
 *
 * The arc is open at the bottom, so it stops about 80pt above the foot of its
 * own box. `copy` subtracts this, which is what puts that text a normal gap
 * under the arc rather than an inch under an invisible edge.
 *
 * Off the geometry `ArcGauge` draws: 220 degrees from 160, at this size and
 * stroke. A deeper sweep is a smaller number.
 */
const GAUGE_BOTTOM_SLACK = 80;

/**
 * The first thing on the plan screen: the week, as one number.
 *
 * Everything inside the arc explains the number — what it is called, what it
 * is, and what it is made of. The two lines in the arc's opening are the ones
 * that need a sentence rather than a number: what keeping today would make it,
 * and where the plan itself has got to.
 *
 * No animation. This is a tab somebody lands on several times a week, and a
 * count-up and an arc sweep every time is ceremony for a number that has
 * usually not changed since they last looked.
 */
export default function PlanHeroCard({
  score,
  position,
  isLoading,
}: {
  score: AzoraScore | null;
  /** The plan's position label, e.g. "Week 2 of 4". Null while unknown. */
  position: string | null;
  isLoading: boolean;
}) {
  if (isLoading || score == null) {
    return (
      <View style={[card.base, card.shadow, styles.hero]}>
        <Skeleton width={GAUGE_SIZE} height={GAUGE_SIZE} radius={GAUGE_SIZE / 2} />
      </View>
    );
  }

  const ifKept = azoraScoreIfTodayKept(score);

  return (
    <View style={[card.base, card.shadow, styles.hero]}>
      <ArcGauge fill={score.score / 100} size={GAUGE_SIZE} stroke={GAUGE_STROKE}>
        <View style={styles.readout}>
          <Text style={styles.caption}>Azora Score</Text>
          <Text style={styles.value}>{score.score}</Text>
          {/* The fraction the number is made of, so somebody who disagrees
              with it can check it. An adjective never lets them. */}
          <Text style={styles.detail}>{azoraScoreDetail(score)}</Text>
        </View>
      </ArcGauge>

      <View style={styles.copy}>
        {ifKept == null ? null : (
          /* The one forward-looking line, and it is a fact rather than a
             promise: the same week with today in it. */
          <Text style={styles.prospect}>
            Finish today and it becomes{' '}
            <Text style={styles.prospectValue}>{ifKept}</Text>
          </Text>
        )}
        {position == null ? null : (
          /* Named, because on its own under a sentence about the score it
             reads as part of that sentence rather than as the plan. */
          <Text style={styles.position}>Your plan · {position}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  readout: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  caption: {
    ...typography.overline,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    /** Lifted off the number, which it otherwise crowds at this size. */
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: VALUE_SIZE,
    lineHeight: VALUE_LINE_HEIGHT,
    letterSpacing: -2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  detail: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.xs,
    /** A standard gap under the arc itself, counted from its drawn bottom. */
    marginTop: spacing.lg - GAUGE_BOTTOM_SLACK,
  },
  prospect: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  prospectValue: {
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  position: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
