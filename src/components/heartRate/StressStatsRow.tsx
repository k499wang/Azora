import { Text } from '../common/Text';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { StressStats } from '../../lib/heartRate/stress';

interface StressStatsRowProps {
  stats: StressStats;
}

function formatValue(value: number | null): string {
  return value == null ? '--' : `${Math.round(value)}`;
}

function formatTrend(trend: number | null): { label: string; color: string } | null {
  if (trend == null || trend === 0) return null;
  const isImprovement = trend < 0;
  const arrow = isImprovement ? '▼' : '▲';
  return {
    label: `${arrow} ${Math.abs(trend)} vs last week`,
    color: isImprovement ? colors.primary.blue600 : colors.orange[600],
  };
}

export default function StressStatsRow({ stats }: StressStatsRowProps) {
  if (stats.count === 0) return null;

  const trend = formatTrend(stats.trendVsPriorWeek);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <StatCell label="Avg" value={formatValue(stats.avg)} />
        <Divider />
        <StatCell label="Best" value={formatValue(stats.min)} />
        <Divider />
        <StatCell label="Highest" value={formatValue(stats.max)} />
      </View>

      {trend != null ? (
        <Text style={[styles.trend, { color: trend.color }]}>{trend.label}</Text>
      ) : null}
    </View>
  );
}

interface StatCellProps {
  label: string;
  value: string;
}

function StatCell({ label, value }: StatCellProps) {
  return (
    <View style={styles.cell}>
      <View style={styles.valueRow}>
        <Text style={styles.cellValue}>{value}</Text>
        {value !== '--' ? <Text style={styles.cellMax}>/100</Text> : null}
      </View>
      <Text style={styles.cellLabel}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[100],
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  cellValue: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  cellMax: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.text.tertiary,
  },
  cellLabel: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.neutral[200],
  },
  trend: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    textAlign: 'center',
  },
});
