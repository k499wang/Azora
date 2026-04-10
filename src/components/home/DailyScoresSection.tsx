import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, padding, margin } from '../../theme/spacing';
import { formatDuration } from '../../utils/time';

interface ScoreItem {
  value: string;
  label: string;
  unit?: string;
}

interface DailyScoresSectionProps {
  bestHoldSeconds: number;
  totalPracticeSeconds: number;
  sessionCount: number;
}

export default function DailyScoresSection({
  bestHoldSeconds,
  totalPracticeSeconds,
  sessionCount,
}: DailyScoresSectionProps) {
  const scores: ScoreItem[] = [
    { value: formatDuration(bestHoldSeconds), label: 'Best hold' },
    { value: formatDuration(totalPracticeSeconds), label: 'Practice time' },
    { value: String(sessionCount), label: 'Sessions' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Today&apos;s statistics</Text>
      <View style={styles.row}>
        {scores.map((score) => (
          <View key={score.label} style={styles.item}>
            <View style={styles.circle}>
              <Text style={styles.value}>{score.value}</Text>
              {score.unit ? <Text style={styles.unit}>{score.unit}</Text> : null}
            </View>
            <Text style={styles.label}>{score.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  title: {
    ...typography.title.title3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background.elevated,
    borderWidth: 6,
    borderColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  value: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  unit: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
    marginTop: -2,
  },
  label: {
    ...typography.body.xsmall,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 96,
  },
});
