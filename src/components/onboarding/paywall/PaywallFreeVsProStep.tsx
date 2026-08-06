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
} from '../../../services/subscriptions/featureAccess';
import { getCaptureModeConfig } from '../../../lib/heartRate/captureModes';

const QUICK_MODE = getCaptureModeConfig('quick');
const FULL_MODE = getCaptureModeConfig('full');

interface ComparisonRow {
  label: string;
  /** null renders the "not included" dash in the Free column. */
  free: string | true | null;
}

// Free cells that mirror a runtime gate are derived from that gate, so a limit
// change in featureAccessCore or captureModes can never leave this screen lying.
function dailyExerciseFreeLabel(): string | null {
  const access = getFeatureAccess({
    feature: FeatureKey.DailyExercise,
    isPro: false,
  });
  if (access.reason === 'pro_only') return null;
  return access.limit != null ? `${access.limit} / day` : null;
}

export function PaywallFreeVsProStep() {
  const rows = useMemo<ComparisonRow[]>(
    () => [
      {
        label: `Quick scan · ${Math.round(QUICK_MODE.durationMs / 1000)}s`,
        free: QUICK_MODE.requiresPro ? null : true,
      },
      {
        label: `Full HRV scan · ${Math.round(FULL_MODE.durationMs / 1000)}s`,
        free: FULL_MODE.requiresPro ? null : true,
      },
      { label: 'Breathing sessions', free: dailyExerciseFreeLabel() },
      { label: 'Personalized plan', free: null },
      { label: 'Live heart rate', free: null },
      { label: 'Stress insights', free: null },
      { label: 'Session history', free: null },
    ],
    [],
  );

  return (
    <View style={paywallStepStyles.stepContainer}>
      <View style={paywallStepStyles.stepHeader}>
        <Text style={paywallStepStyles.stepTitle}>
          Azora is free.{'\n'}Here&apos;s what{' '}
          <Text style={paywallStepStyles.stepTitleBrand}>Pro</Text> adds.
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
  absentDash: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.neutral[300],
  },
});

export default PaywallFreeVsProStep;
