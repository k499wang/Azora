import { Text } from '../../common/Text';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { paywallStepStyles } from './paywallStepStyles';
import {
  FeatureKey,
  getFeatureAccess,
  type FeatureKeyValue,
} from '../../../services/subscriptions/featureAccess';
import { getCaptureModeConfig } from '../../../lib/heartRate/captureModes';
import { DAILIES_PER_DAY } from '../../../lib/dailies';

const QUICK_MODE = getCaptureModeConfig('quick');
const FULL_MODE = getCaptureModeConfig('full');

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

// A decoration is earned by finishing every daily, so the free tier reaches the
// room only when its session limit covers all of them. Derived rather than
// hardcoded for the same reason as the row above: raising the limit must move
// this cell on its own, not leave the paywall claiming a lock that is gone.
function dailyDecorationFreeCell(): true | null {
  const access = getFeatureAccess({
    feature: FeatureKey.DailyExercise,
    isPro: false,
  });
  if (access.reason === 'pro_only') return null;
  if (access.limit == null) return true;
  return access.limit >= DAILIES_PER_DAY ? true : null;
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
      {
        label: `Quick scan · ${Math.round(QUICK_MODE.durationMs / 1000)}s`,
        free: QUICK_MODE.requiresPro
          ? null
          : featureFreeCell(FeatureKey.HeartRateMeasurement),
      },
      {
        label: `Full HRV scan · ${Math.round(FULL_MODE.durationMs / 1000)}s`,
        free: FULL_MODE.requiresPro ? null : true,
      },
      {
        label: 'Guided resets',
        free: featureFreeCell(FeatureKey.DailyExercise),
      },
      { label: 'Daily room decoration', free: dailyDecorationFreeCell() },
      { label: 'Personalized plan', free: true },
      { label: 'Live heart rate', free: null },
      { label: 'Stress insights', free: null },
      {
        label: 'Session history',
        free: featureFreeCell(FeatureKey.SessionHistory),
      },
    ],
    [],
  );

  return (
    <View style={paywallStepStyles.stepContainer}>
      <View style={paywallStepStyles.stepHeader}>
        <Text style={paywallStepStyles.stepTitle}>
          {hasTrial ? (
            <>
              Everything unlocked{'\n'}for{' '}
              <Text style={paywallStepStyles.stepTitleBrand}>
                {trialDays} days
              </Text>
              .
            </>
          ) : (
            <>
              What <Text style={paywallStepStyles.stepTitleBrand}>Pro</Text>{' '}
              adds.
            </>
          )}
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
                <Icon name="check" size={22} color={colors.text.secondary} />
              ) : row.free != null ? (
                <Text style={styles.freeValue}>{row.free}</Text>
              ) : (
                <View style={styles.absentDash} />
              )}
            </View>
            <View style={styles.valueCell}>
              <Icon name="check" size={22} color={colors.primary.blue600} />
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

const PRO_COLUMN_WIDTH = 76;
const ROW_HEIGHT = 46;

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
    borderRadius: 18,
    backgroundColor: colors.primary.blue100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
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
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  proPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
  },
  proPillText: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.neutral[0],
    letterSpacing: 0.5,
  },
  freeValue: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  trialFootnote: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue600,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  absentDash: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.neutral[300],
  },
});

export default PaywallFreeVsProStep;
