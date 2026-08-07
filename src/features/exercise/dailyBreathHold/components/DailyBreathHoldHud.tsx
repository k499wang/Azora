import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SettingsGearButton } from '../../../audioSettings';
import { isHapticsEnabled } from '../../../../services/preferences/hapticsPreference';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';

interface DailyBreathHoldHudProps {
  theme: ExerciseDarkTheme;
  onSettingsPress: () => void;
  onExit: () => void;
  onStart: () => void;
}

/**
 * The pre-session row only. Once the character is on screen the close and pause
 * controls move to the glass buttons in the scaffold header, so nothing sits on
 * top of the blob.
 */
export function DailyBreathHoldHud({
  theme,
  onSettingsPress,
  onExit,
  onStart,
}: DailyBreathHoldHudProps) {
  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <ControlButton icon="close" label="Exit" theme={theme} onPress={onExit} />
        <SettingsGearButton
          onPress={onSettingsPress}
          label="Session options"
          iconName="tune-variant"
          color={theme.iconPrimary}
          backgroundColor={theme.surface}
          borderColor={theme.surfaceBorder}
          size={64}
        />
        <ControlButton icon="play" label="Start" theme={theme} onPress={onStart} />
      </View>
    </View>
  );
}

interface ControlButtonProps {
  icon: 'close' | 'pause' | 'play';
  label: string;
  theme: ExerciseDarkTheme;
  onPress: () => void;
}

function ControlButton({ icon, label, theme, onPress }: ControlButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.controlButton,
        { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
        pressed && styles.buttonPressed,
      ]}
      onPress={() => {
        if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MaterialCommunityIcons name={icon} size={27} color={theme.iconPrimary} />
    </Pressable>
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
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
