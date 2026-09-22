import { Text } from '../../components/common/Text';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import AudioSettingsRow from './AudioSettingsRow';

interface HeartRateMonitoringSectionProps {
  enabled: boolean;
  proLocked: boolean;
  onSelect: (enabled: boolean) => void;
}

export default function HeartRateMonitoringSection({
  enabled,
  proLocked,
  onSelect,
}: HeartRateMonitoringSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Heart rate monitoring</Text>
      <Text style={styles.description}>
        Show your live heart rate while you breathe.
      </Text>

      <View style={styles.list}>
        <AudioSettingsRow
          label="On"
          selected={enabled}
          premiumLocked={proLocked}
          onSelect={() => onSelect(true)}
        />
        <AudioSettingsRow
          label="Off"
          selected={!enabled}
          onSelect={() => onSelect(false)}
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
