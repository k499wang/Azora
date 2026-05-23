import { StyleSheet, Text, View } from 'react-native';
import AudioSettingsRow from './AudioSettingsRow';
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

      <View style={styles.list}>
        <AudioSettingsRow
          label="On"
          selected={enabled}
          onSelect={() => onToggle(true)}
        />
        <AudioSettingsRow
          label="Off"
          selected={!enabled}
          onSelect={() => onToggle(false)}
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
