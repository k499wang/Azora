import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { isShortScreen } from '../../../../theme/breakpoints';
import { spacing } from '../../../../theme/spacing';
import { SessionLipButton } from '../../shared/components/SessionLipButton';

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
  const { height } = useWindowDimensions();
  const compact = isShortScreen(height);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.buttonRow}>
        <SessionLipButton
          theme={theme}
          icon="cog-outline"
          label="Session options"
          onPress={onSettingsPress}
        />
        <SessionLipButton
          theme={theme}
          icon="play"
          label="Start"
          onPress={onStart}
          primary
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    gap: spacing.lg,
    marginBottom: spacing['4xl'],
  },
  containerCompact: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    width: '100%',
    gap: spacing.md,
  },
});
