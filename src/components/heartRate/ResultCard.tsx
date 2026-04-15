import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { HeartRateReading } from '../../lib/heartRate/types';

interface ResultCardProps {
  reading: HeartRateReading;
  label?: string;
}

function getConfidenceInfo(confidence: number): { label: string; color: string } {
  if (confidence > 0.7) return { label: 'High', color: colors.success[500] };
  if (confidence > 0.4) return { label: 'Moderate', color: colors.warning[500] };
  return { label: 'Low', color: colors.error[500] };
}

export function ResultCard({ reading, label = 'Heart Rate' }: ResultCardProps) {
  const confidenceInfo = getConfidenceInfo(reading.confidence);
  const recordedDate = new Date(reading.recordedAt);
  const timeString = recordedDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      {/* Left: icon + label */}
      <View style={styles.leftSection}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="heart-pulse"
            size={20}
            color={colors.error[500]}
          />
        </View>
        <View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.time}>{timeString}</Text>
        </View>
      </View>

      {/* Right: BPM + confidence */}
      <View style={styles.rightSection}>
        <View style={styles.bpmRow}>
          <Text style={styles.bpmNumber}>{reading.bpm}</Text>
          <Text style={styles.bpmUnit}>bpm</Text>
        </View>
        <View style={[styles.confidencePill, { backgroundColor: `${confidenceInfo.color}15` }]}>
          <Text style={[styles.confidenceText, { color: confidenceInfo.color }]}>
            {confidenceInfo.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.elevated,
    borderRadius: 14,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.body.small,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  time: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  bpmRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bpmNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 32,
  },
  bpmUnit: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  confidencePill: {
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  confidenceText: {
    ...typography.caption.caption2,
    fontWeight: '600',
  },
});
