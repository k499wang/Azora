import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import RingStatCard from './RingStatCard';
import HRVChart from './HRVChart';

interface SessionStatsPagerProps {
  avgBpm?: number | null;
  holdSeconds?: number | null;
  healthScore?: number | null;
  ibiMs?: number[];
}

function formatHold(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '--';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function SessionStatsPager({
  avgBpm,
  holdSeconds,
  healthScore,
  ibiMs = [],
}: SessionStatsPagerProps) {
  const bpmValue = avgBpm == null ? '--' : `${Math.round(avgBpm)}`;
  const holdValue = formatHold(holdSeconds);
  const healthValue = healthScore == null ? '--' : `${Math.round(healthScore)}`;

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Today&apos;s insights</Text>

      <View style={styles.smallRingsRow}>
        <RingStatCard
          label="BPM"
          value={bpmValue}
          target="60"
          progress={avgBpm == null ? 0 : avgBpm / 130}
          color={colors.error[500]}
          trackColor={colors.neutral[200]}
          icon="heart-bpm"
        />
        <RingStatCard
          label="Hold"
          value={holdValue}
          target="2:00"
          progress={holdSeconds == null ? 0 : holdSeconds / 120}
          color={colors.primary.blue500}
          trackColor={colors.neutral[200]}
          icon="breath-timer"
        />
        <RingStatCard
          label="Health"
          value={healthValue}
          target="100"
          progress={healthScore == null ? 0 : healthScore / 100}
          color={colors.success[500]}
          trackColor={colors.neutral[200]}
          icon="heart-glow"
        />
      </View>
      <HRVChart ibiMs={ibiMs} color={colors.error[500]} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.md,
  },
  title: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  smallRingsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
