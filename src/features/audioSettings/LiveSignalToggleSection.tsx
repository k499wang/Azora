import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface LiveSignalToggleSectionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function LiveSignalToggleSection({
  enabled,
  onToggle,
}: LiveSignalToggleSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Live signal graph</Text>
      <Text style={styles.description}>
        Show the live PPG waveform above the breathing circle.
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Show live signal graph</Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{
            false: colors.neutral[300],
            true: colors.primary.blue300,
          }}
          thumbColor={enabled ? colors.primary.blue600 : colors.neutral[50]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  title: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  description: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: 2,
    marginBottom: spacing.sm + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.background.elevated,
    gap: spacing.sm,
  },
  label: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flex: 1,
  },
});
