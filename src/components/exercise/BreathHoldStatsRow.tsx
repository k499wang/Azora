import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import CardSurface from '../common/CardSurface';

interface Props {
  bestHoldSeconds: number | null;
  avgHoldSeconds: number | null;
  todayHoldSeconds: number | null;
}

function formatHoldTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface Improvement {
  label: string;
  color: string;
}

function deriveImprovement(
  todayHoldSeconds: number | null,
  avgHoldSeconds: number | null,
): Improvement | null {
  if (todayHoldSeconds == null || avgHoldSeconds == null) return null;
  const delta = Math.round(todayHoldSeconds - Math.round(avgHoldSeconds));
  if (delta > 0) {
    return { label: `+${formatHoldTime(delta)}`, color: colors.success[700] };
  }
  if (delta < 0) {
    return { label: `−${formatHoldTime(-delta)}`, color: colors.error[500] };
  }
  return { label: 'Even', color: colors.text.secondary };
}

export default function BreathHoldStatsRow({
  bestHoldSeconds,
  avgHoldSeconds,
  todayHoldSeconds,
}: Props) {
  const improvement = deriveImprovement(todayHoldSeconds, avgHoldSeconds);

  return (
    <CardSurface style={styles.card}>
      <View style={styles.row}>
        <Stat
          label="Best"
          value={bestHoldSeconds != null ? formatHoldTime(bestHoldSeconds) : '—'}
        />
        <View style={styles.divider} />
        <Stat
          label="7-day avg"
          value={avgHoldSeconds != null ? formatHoldTime(avgHoldSeconds) : '—'}
        />
        <View style={styles.divider} />
        <Stat
          label="vs avg"
          value={improvement?.label ?? '—'}
          valueColor={improvement?.color}
        />
      </View>

      <View style={styles.sectionDivider} />

      <ProgressToBest
        todayHoldSeconds={todayHoldSeconds}
        bestHoldSeconds={bestHoldSeconds}
      />
    </CardSurface>
  );
}

interface StatProps {
  label: string;
  value: string;
  valueColor?: string;
}

function Stat({ label, value, valueColor }: StatProps) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.value, valueColor != null && { color: valueColor }]}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

interface ProgressToBestProps {
  todayHoldSeconds: number | null;
  bestHoldSeconds: number | null;
}

function ProgressToBest({ todayHoldSeconds, bestHoldSeconds }: ProgressToBestProps) {
  const today = todayHoldSeconds ?? 0;
  const best = bestHoldSeconds ?? 0;
  const isPr = best > 0 && today >= best;
  const fillPct = best > 0 ? Math.min(1, Math.max(0, today / best)) : 0;
  const fillColor = isPr ? colors.yellow[400] : colors.primary.blue600;

  return (
    <View style={styles.barWrap}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>
          Today{' '}
          <Text style={styles.barValue}>
            {today > 0 ? formatHoldTime(today) : '—'}
          </Text>
        </Text>
        <Text style={[styles.barLabel, styles.bestLabel]}>
          {isPr ? 'New best' : 'Best'}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${fillPct * 100}%`, backgroundColor: fillColor }]}
        />
        <View style={styles.marker} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    ...typography.title.title3,
    fontSize: 23,
    lineHeight: 28,
    fontFamily: fonts.medium,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
    color: colors.text.primary,
  },
  label: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text.tertiary,
    letterSpacing: 0.2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: spacing.xs,
    backgroundColor: colors.border.subtle,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  barWrap: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  barHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  barLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text.tertiary,
    letterSpacing: 0.2,
  },
  barValue: {
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  bestLabel: {
    color: colors.warning[700],
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neutral[100],
    position: 'relative',
    overflow: 'visible',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 5,
  },
  marker: {
    position: 'absolute',
    right: 0,
    top: -3,
    bottom: -3,
    width: 2,
    marginRight: -1,
    borderRadius: 1,
    backgroundColor: colors.warning[500],
  },
});
