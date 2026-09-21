import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import ArcGauge from '../../components/common/ArcGauge';
import FeatureInfoDialog from '../../components/common/FeatureInfoDialog';
import Icon from '../../components/common/icons/Icon';
import Skeleton from '../../components/common/Skeleton';
import { azoraScoreIfTodayKept, type AzoraScore } from './domain/azoraScore';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, scaleType, typography } from '../../theme/typography';

const GAUGE_SIZE = 288;
/**
 * About a sixteenth of the diameter.
 *
 * The arc is a scale rather than the content: the number inside it is what the
 * card is for, and a heavier stroke competes with it. Thick enough not to read
 * as a spinner that has stopped.
 */
const GAUGE_STROKE = 18;
/** Off the type scale on purpose, the way a hero title is; scaled for tablets. */
const VALUE_SIZE = 64;
const VALUE_LINE_HEIGHT = 70;
/**
 * Where the arc's two ends sit, as a sine of the radius.
 *
 * Off the geometry `ArcGauge` draws: 220 degrees from 160, so both ends stop at
 * sin(160) = 0.342 of the radius below the middle of its square. A deeper sweep
 * is a smaller number.
 */
const ARC_END_SINE = 0.342;
/** Matches the room `ArcGauge` leaves on the stroke for its knob. */
const KNOB_OVERHANG = 3;
/** Radius of the arc itself, inside its box, at this size and stroke. */
const GAUGE_RADIUS = GAUGE_SIZE / 2 - GAUGE_STROKE / 2 - KNOB_OVERHANG;
/**
 * How much taller the square that draws the arc is than the arc itself.
 *
 * The arc is open at the bottom, so it stops about a third of the radius above
 * the foot of its own box. `copy` subtracts this, which is what puts that text
 * a normal gap under the arc rather than an inch under an invisible edge.
 */
const GAUGE_BOTTOM_SLACK = Math.round(GAUGE_SIZE / 2 - GAUGE_RADIUS * ARC_END_SINE);
/**
 * How far the middle of the drawn arc sits above the middle of its box.
 *
 * The arc occupies the top of its square, so a readout centred in the square —
 * which is what the gauge does on its own — sits low in the dial.
 */
const GAUGE_ARC_RISE = Math.round((GAUGE_RADIUS * (1 - ARC_END_SINE)) / 2);
/** One line of `heading.heading1`, which is what the title row is. */
const TITLE_ROW_HEIGHT = 26;
/** Everything the readout hangs under the number: the gap, then the title. */
const READOUT_TAIL = spacing.xs + TITLE_ROW_HEIGHT;
/**
 * How far to lift the readout so the number itself lands on the arc's centre.
 *
 * Only the number is centred; the title below it hangs in the arc's opening,
 * and centring the block as a whole would push the number above the mark by
 * half of that tail.
 */
const READOUT_LIFT = Math.round(GAUGE_ARC_RISE - READOUT_TAIL / 2);

/**
 * What this screen's Azora Score is, for the question the number invites.
 *
 * The fraction the number is made of used to be printed under it. A sentence is
 * the better home for it: the number stays the only figure inside the arc, and
 * somebody who disagrees with the score can still see what it counted and what
 * it deliberately does not.
 */
const AZORA_SCORE_INFO = {
  title: 'Azora Score',
  message:
    'Your Azora Score is your plan-completion rate. It is calculated as: days you completed part of your plan divided by days in the scoring window × 100.\n\nThe scoring window is the last seven days. For example, completing your plan on 5 of 7 days gives you a score of 71. During your first week, it uses only the days since your plan started — completing all 3 days of a new plan gives you 100.\n\nIt measures consistency, not overall progress through the plan. The score can go down when an earlier completed day moves out of the seven-day window.',
};

/**
 * The first thing on the plan screen: the week, as one number.
 *
 * Everything inside the arc explains the number — what it is called, and what
 * it is. The two lines in the arc's opening are the ones that need a sentence
 * rather than a number: what keeping today would make it, and where the plan
 * itself has got to.
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
  const [infoVisible, setInfoVisible] = useState(false);

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
          <Text style={styles.value}>{score.score}</Text>
          <View style={styles.titleRow}>
            {/* Balances the info button so the title is centred on the number
                above it rather than pushed off-axis by the button. */}
            <View style={styles.infoButton} />
            <Text style={styles.title}>Azora Score</Text>
            <Pressable
              accessibilityLabel="What is the Azora Score?"
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => setInfoVisible(true)}
              style={styles.infoButton}
            >
              <Icon name="info" size={16} color={colors.text.tertiary} />
            </Pressable>
          </View>
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

      <FeatureInfoDialog
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title={AZORA_SCORE_INFO.title}
        intro={AZORA_SCORE_INFO.message}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    /** A step narrower than the other cards: the gauge is the widest thing in
        the app and this is what lets it grow. */
    paddingHorizontal: spacing.md,
  },
  readout: {
    alignItems: 'center',
    gap: spacing.xs,
    transform: [{ translateY: -READOUT_LIFT }],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...typography.display.display1,
    fontSize: scaleType(VALUE_SIZE),
    lineHeight: scaleType(VALUE_LINE_HEIGHT),
    letterSpacing: -2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
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
