import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import RingStatCard from './RingStatCard';
import HRVChart from './HRVChart';

const HEALTH_INFO = {
  title: 'Health Score',
  message:
    'A 0–100 composite score based on heart rate, HRV, breath hold, and recovery during the session. A higher score indicates better overall cardiorespiratory health.\n\n70+ is considered strong; 85+ is excellent.',
};

interface SessionStatsPagerProps {
  title?: string;
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
  title = 'Today\'s insights',
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
      <Text style={styles.title}>{title}</Text>

      <View style={styles.smallRingsRow}>
        <RingStatCard
          label="BPM"
          value={bpmValue}
          progress={avgBpm == null ? 0 : avgBpm / 130}
          color={colors.error[700]}
          trackColor={colors.neutral[200]}
          icon="stat-heart-pulse"
        />
        <RingStatCard
          label="Hold"
          value={holdValue}
          progress={holdSeconds == null ? 0 : holdSeconds / 120}
          color={colors.primary.blue700}
          trackColor={colors.neutral[200]}
          icon="stat-breath-flow"
        />
        <RingStatCard
          label="Health"
          value={healthValue}
          target="100"
          progress={healthScore == null ? 0 : healthScore / 100}
          color={colors.orange[700]}
          trackColor={colors.neutral[200]}
          icon="stat-health-spark"
          info={HEALTH_INFO}
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
