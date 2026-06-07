import { StyleSheet, Text, View } from 'react-native';
import AudioSettingsRow from './AudioSettingsRow';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface HeartRateMonitoringSectionProps {
  enabled: boolean;
  locked?: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function HeartRateMonitoringSection({
  enabled,
  locked = false,
  onToggle,
}: HeartRateMonitoringSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Heart rate monitoring</Text>
      <Text style={styles.description}>
        {locked
          ? 'End this session to change whether heart rate is measured.'
          : 'Measure heart rate before supported breathing sessions.'}
      </Text>

      <View style={styles.list}>
        <AudioSettingsRow
          label="On"
          selected={enabled}
          onSelect={() => onToggle(true)}
          disabled={locked}
        />
        <AudioSettingsRow
          label="Off"
          selected={!enabled}
          onSelect={() => onToggle(false)}
          disabled={locked}
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
  list: {
    gap: spacing.xs + 2,
  },
});
