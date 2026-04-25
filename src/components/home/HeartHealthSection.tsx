import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { card } from '../../theme/card';
import SectionHeader from '../common/SectionHeader';
import BigRingStatCard from './BigRingStatCard';
import { computeHRVStats } from '../../lib/hrv';

interface HeartHealthSectionProps {
  ibiMs?: number[];
}

const DEFAULT_IBI_MS: number[] = [
  790, 812, 835, 818, 802, 845, 870, 858, 832, 880,
  905, 892, 915, 940, 928, 952, 975, 962, 985, 1010,
  998, 1025, 1048, 1032, 1018, 1045, 1062,
];

function buildInsight(rmssd: number, sdnn: number, hrDrop: number): {
  tone: string;
  detail: string;
} {
  if (rmssd >= 55 && sdnn >= 45) {
    return {
      tone: 'Strong recovery',
      detail:
        hrDrop > 0
          ? `Your variability looks strong today and your heart rate settled by ${hrDrop} bpm during recovery.`
          : 'Your variability looks strong today, with a stable recovery pattern through the session.',
    };
  }

  if (rmssd >= 35 && sdnn >= 30) {
    return {
      tone: 'Balanced pattern',
      detail:
        hrDrop > 0
          ? `Your breath hold shows a steady recovery response, with heart rate easing down by ${hrDrop} bpm.`
          : 'Your variability sits in a balanced range today, though recovery looks more flat than usual.',
    };
  }

  return {
    tone: 'Recovery is muted',
    detail:
      hrDrop > 0
        ? `Variability is on the lower side today. A ${hrDrop} bpm drop still shows some recovery, but the signal suggests stress or fatigue.`
        : 'Variability is on the lower side today, which can happen when stress, fatigue, or inconsistent breathing is higher.',
  };
}

export default function HeartHealthSection({
  ibiMs = DEFAULT_IBI_MS,
}: HeartHealthSectionProps) {
  const stats = computeHRVStats(ibiMs);
  const insight = buildInsight(stats.rmssd, stats.sdnn, stats.hrDrop);

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader title="Heart health" />
      </View>

      <View style={styles.metricRow}>
        <BigRingStatCard
          label="RMSSD"
          value={`${stats.rmssd}`}
          target="60"
          progress={stats.rmssd / 60}
          color={colors.primary.blue500}
          trackColor={colors.neutral[200]}
          icon="heart-rmssd"
        />
        <BigRingStatCard
          label="Stress"
          value={`${stats.stress}`}
          target="30"
          progress={stats.stress / 30}
          color={colors.success[500]}
          trackColor={colors.neutral[200]}
          icon="heart-sdnn"
        />
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightEyebrow}>Insight</Text>
        <Text style={styles.insightTone}>{insight.tone}</Text>
        <Text style={styles.insightDetail}>{insight.detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  headerWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
  },
  insightCard: {
    ...card.base,
    ...card.shadow,
    marginHorizontal: padding.screen.horizontal,
    minHeight: 136,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  insightEyebrow: {
    ...typography.label.small,
    color: colors.primary.blue600,
  },
  insightTone: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  insightDetail: {
    ...typography.body.small,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
