import { Text } from '../../common/Text';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { scaleControl } from '../onboardingVisualScale';
import { paywallStepStyles } from './paywallStepStyles';
import { PaywallSection } from '../../paywall/longForm/PaywallSection';
import { card } from '../../../theme/card';
import {
  FeatureKey,
  getFeatureAccess,
  type FeatureKeyValue,
} from '../../../services/subscriptions/featureAccess';
import type { OnboardingIntent } from '../types';
import { personalizedRoutineLabel } from '../../../lib/paywallPlanHighlights';

interface ComparisonRow {
  label: string;
  /** null renders the "not included" dash in the Free column. */
  free: string | true | null;
}

// Free cells that mirror a runtime gate are derived from that gate, so a policy
// change in featureAccessCore or captureModes cannot leave this screen lying.
function featureFreeCell(feature: FeatureKeyValue): string | true | null {
  const access = getFeatureAccess({
    feature,
    isPro: false,
  });
  if (access.reason === 'pro_only') return null;
  return access.limit != null ? `${access.limit} / day` : true;
}

interface PaywallFreeVsProStepProps {
  hasTrial: boolean;
  /** The store's trial length, e.g. `7-day`. Only read when there is a trial. */
  trialDuration?: string;
  intent?: OnboardingIntent;
  durationMinutes: number;
  /**
   * `step` when the deck is paging through it, `section` on the long-form page,
   * where the heading has to sit in the page's own section rhythm.
   */
  layout?: 'step' | 'section';
}

export function PaywallFreeVsProStep({
  hasTrial,
  trialDuration,
  intent,
  durationMinutes,
  layout = 'step',
}: PaywallFreeVsProStepProps) {
  const isSection = layout === 'section';
  const parsedTrialDays = Number.parseInt(trialDuration ?? '', 10);
  const trialDays = Number.isFinite(parsedTrialDays) ? parsedTrialDays : 7;
  const rows = useMemo<ComparisonRow[]>(
    () => [
      // The plan they were just handed is what is being sold, so it is not a
      // free-column yes.
      { label: personalizedRoutineLabel(intent, durationMinutes), free: null },
      {
        label: 'Quick daily exercises',
        free: featureFreeCell(FeatureKey.DailyExercise),
      },
      {
        label: 'Full exercise library',
        free: featureFreeCell(FeatureKey.ExerciseLibrary),
      },
      { label: 'Azo companion guidance', free: true },
      {
        label: 'Progress tracking',
        free: featureFreeCell(FeatureKey.SessionHistory),
      },
      {
        label: 'Detailed recovery insights',
        free: featureFreeCell(FeatureKey.AdvancedStats),
      },
      {
        label: 'Live heart rate in exercises',
        free: featureFreeCell(FeatureKey.BreathingHeartRateMonitoring),
      },
    ],
    [durationMinutes, intent],
  );

  const title = (
    <>
      What your{' '}
      <Text style={isSection ? styles.sectionTitleBrand : paywallStepStyles.stepTitleBrand}>
        plan
      </Text>{' '}
      includes
    </>
  );

  const table = (
    <View style={[styles.table, isSection ? styles.tableSection : styles.tableInStep]}>
      <View style={[styles.proBand, isSection && styles.proBandSection]} />

      <View style={styles.headerRow}>
        <View style={styles.labelCell} />
        <Text style={[styles.columnHeading, styles.valueCell]}>Free</Text>
        <View style={styles.valueCell}>
          <View style={styles.proPill}>
            <Text style={styles.proPillText}>PRO</Text>
          </View>
        </View>
      </View>

      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[styles.row, index > 0 && styles.rowDivided]}
        >
          <Text style={styles.rowLabel}>{row.label}</Text>
          <View style={styles.valueCell}>
            {row.free === true ? (
              <Icon name="check" size={CHECK_SIZE} color={colors.text.secondary} />
            ) : row.free != null ? (
              <Text style={styles.freeValue}>{row.free}</Text>
            ) : (
              <View style={styles.absentDash} />
            )}
          </View>
          <View style={styles.valueCell}>
            <Icon name="check" size={CHECK_SIZE} color={colors.primary.blue500} />
          </View>
        </View>
      ))}
    </View>
  );

  const footnote = hasTrial ? (
    <Text style={[styles.trialFootnote, !isSection && styles.trialFootnoteInStep]}>
      Every Pro row is yours free for {trialDays} days.
    </Text>
  ) : null;

  // On the long page this is one more section, so it takes the page's section
  // heading and the gap that goes with it rather than the deck's own rhythm.
  if (isSection) {
    return (
      <PaywallSection title={title} singleLineTitle>
        {table}
        {footnote}
      </PaywallSection>
    );
  }

  return (
    <View style={paywallStepStyles.stepContainer}>
      <View style={paywallStepStyles.stepHeader}>
        <Text style={paywallStepStyles.stepTitle}>{title}</Text>
      </View>

      {table}
      {footnote}
    </View>
  );
}

const PRO_COLUMN_WIDTH = scaleControl(76);
const ROW_HEIGHT = scaleControl(46);
const HEADER_ROW_HEIGHT = scaleControl(44);
const CHECK_SIZE = scaleControl(22);

const styles = StyleSheet.create({
  table: {
    paddingHorizontal: spacing.xs,
  },
  // The deck's heading sits close above the table, so the table holds it off
  // itself there. The long page's section gap already does this.
  tableInStep: {
    marginTop: spacing.lg,
  },
  // On the page the table is a card like the plans and the testimonials, so it
  // takes the standard surface, radius and outline, and the inner room that
  // outline needs.
  tableSection: {
    ...card.base,
    // Clips the highlighted column to the card's own corners, so the band can
    // be a plain square block.
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  // Follows the horizontal padding above, so the band stays behind the PRO
  // column rather than the card's edge.
  proBandSection: {
    right: spacing.md,
  },
  // A square block, full height of the table: the highlighted column reads as a
  // column, not a floating pill.
  proBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: spacing.xs,
    width: PRO_COLUMN_WIDTH,
    backgroundColor: colors.primary.blue100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_ROW_HEIGHT,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ROW_HEIGHT,
    paddingVertical: spacing.xs,
  },
  rowDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  labelCell: {
    flex: 1,
  },
  rowLabel: {
    ...typography.body.medium,
    color: colors.text.primary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  valueCell: {
    width: PRO_COLUMN_WIDTH,
    alignItems: 'center',
  },
  columnHeading: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  proPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primary.blue500,
  },
  proPillText: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.neutral[0],
    letterSpacing: 0.5,
  },
  freeValue: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  trialFootnote: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.primary.blue500,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  trialFootnoteInStep: {
    marginTop: spacing.lg,
  },
  sectionTitleBrand: {
    fontFamily: fonts.semibold,
    color: colors.primary.blue500,
  },
  absentDash: {
    width: scaleControl(16),
    height: scaleControl(2),
    borderRadius: scaleControl(2) / 2,
    backgroundColor: colors.neutral[300],
  },
});

export default PaywallFreeVsProStep;
