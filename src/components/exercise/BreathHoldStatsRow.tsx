import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';

interface Props {
  bestHoldSeconds: number | null;
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
  avgHoldSeconds,
}: Props) {
  return (
    <View style={styles.row}>
      <Stat
        label="Best"
        value={bestHoldSeconds != null ? formatHoldTime(bestHoldSeconds) : '—'}
      />
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
});
