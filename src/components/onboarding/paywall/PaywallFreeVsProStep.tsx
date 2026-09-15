import { Text } from '../../common/Text';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { scaleControl } from '../onboardingVisualScale';
import { paywallStepStyles } from './paywallStepStyles';
import {
  FeatureKey,
  getFeatureAccess,
  type FeatureKeyValue,
} from '../../../services/subscriptions/featureAccess';

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
  trialDuration: string;
}

export function PaywallFreeVsProStep({
  hasTrial,
  trialDuration,
}: PaywallFreeVsProStepProps) {
  const parsedTrialDays = Number.parseInt(trialDuration, 10);
  const trialDays = Number.isFinite(parsedTrialDays) ? parsedTrialDays : 7;
  const rows = useMemo<ComparisonRow[]>(
    () => [
      { label: 'Personalized daily routine', free: true },
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
    [],
  );

  return (
    <View style={paywallStepStyles.stepContainer}>
      <View style={paywallStepStyles.stepHeader}>
        <Text style={paywallStepStyles.stepTitle}>
          What your <Text style={paywallStepStyles.stepTitleBrand}>plan</Text>{' '}
          includes
        </Text>
      </View>

      <View style={styles.table}>
        <View style={styles.proBand} />

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

      {hasTrial ? (
        <Text style={styles.trialFootnote}>
          Every Pro row is yours free for {trialDays} days.
        </Text>
      ) : null}
    </View>
  );
}

const PRO_COLUMN_WIDTH = scaleControl(76);
const ROW_HEIGHT = scaleControl(46);
const HEADER_ROW_HEIGHT = scaleControl(44);
const CHECK_SIZE = scaleControl(22);

const styles = StyleSheet.create({
  table: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  proBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: spacing.xs,
    width: PRO_COLUMN_WIDTH,
    borderRadius: scaleControl(18),
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
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  absentDash: {
    width: scaleControl(16),
    height: scaleControl(2),
    borderRadius: scaleControl(2) / 2,
    backgroundColor: colors.neutral[300],
  },
});

export default PaywallFreeVsProStep;
