import { Text } from '../common/Text';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';

interface Props {
  bestHoldSeconds: number | null;
  todayHoldSeconds: number | null;
  avgHoldSeconds: number | null;
}

function formatHoldTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function BreathHoldStatsRow({
  bestHoldSeconds,
  todayHoldSeconds,
  avgHoldSeconds,
}: Props) {
  return (
    <View style={styles.row}>
      <Stat
        label="Best"
        value={bestHoldSeconds != null ? formatHoldTime(bestHoldSeconds) : '—'}
      />
      <View style={styles.divider} />
      <Stat
        label="Today"
        value={todayHoldSeconds != null ? formatHoldTime(todayHoldSeconds) : '—'}
      />
      <View style={styles.divider} />
      <Stat
        label="7-day avg"
        value={avgHoldSeconds != null ? formatHoldTime(avgHoldSeconds) : '—'}
      />
    </View>
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    ...typography.heading.heading2,
    fontFamily: fonts.regular,
    fontWeight: '400',
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    color: colors.text.primary,
  },
  label: {
    ...typography.label.small,
    fontFamily: fonts.regular,
    fontWeight: '400',
    fontSize: 13,
    color: colors.text.tertiary,
    letterSpacing: 0.2,
  },
});
