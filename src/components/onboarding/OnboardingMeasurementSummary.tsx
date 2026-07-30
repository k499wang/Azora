import { StyleSheet, View } from 'react-native';
import CardSurface from '../common/CardSurface';
import { Text } from '../common/Text';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface OnboardingMeasurementSummaryProps {
  lungAgeYears: number | null;
  restingBpm: number | null;
}

export default function OnboardingMeasurementSummary({
  lungAgeYears,
  restingBpm,
}: OnboardingMeasurementSummaryProps) {
  if (lungAgeYears == null && restingBpm == null) {
    return null;
  }

  return (
    <CardSurface style={styles.card}>
      {lungAgeYears != null ? (
        <MeasurementRow
          label="Lung age"
          value={`${Math.round(lungAgeYears)} years`}
        />
      ) : null}
      {lungAgeYears != null && restingBpm != null ? (
        <View style={styles.divider} />
      ) : null}
      {restingBpm != null ? (
        <MeasurementRow
          label="Resting heart rate"
          value={`${Math.round(restingBpm)} BPM`}
        />
      ) : null}
    </CardSurface>
  );
}

function MeasurementRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    ...typography.body.medium,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  value: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    color: colors.text.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral[200],
  },
});
