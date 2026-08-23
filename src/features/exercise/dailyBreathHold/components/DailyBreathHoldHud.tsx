import { StyleSheet, View } from 'react-native';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { spacing } from '../../../../theme/spacing';
import {
  SESSION_GLASS_CONTROL_SIZE,
  SessionGlassButton,
} from '../../shared/components/SessionGlassButton';

interface DailyBreathHoldHudProps {
  theme: ExerciseDarkTheme;
  onSettingsPress: () => void;
  onStart: () => void;
}

/**
 * The pre-session row only. Close lives in the scaffold header glass button at
 * every phase; pause joins it once the character is on screen, so nothing sits
 * on top of the blob.
 */
export function DailyBreathHoldHud({
  theme,
  onSettingsPress,
  onStart,
}: DailyBreathHoldHudProps) {
  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <SessionGlassButton
          theme={theme}
          icon="cog-outline"
          accessibilityLabel="Session options"
          size={SESSION_GLASS_CONTROL_SIZE}
          onPress={onSettingsPress}
        />
        <SessionGlassButton
          theme={theme}
          icon="play"
          accessibilityLabel="Start"
          size={SESSION_GLASS_CONTROL_SIZE}
          onPress={onStart}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing['4xl'],
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
