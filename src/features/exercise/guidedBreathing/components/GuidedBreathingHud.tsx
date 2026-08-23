import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { spacing } from '../../../../theme/spacing';
import { isShortScreen } from '../../../../theme/breakpoints';
import {
  SESSION_GLASS_CONTROL_SIZE,
  SessionGlassButton,
} from '../../shared/components/SessionGlassButton';
import RoundsHapticPicker from './RoundsHapticPicker';

interface GuidedBreathingHudProps {
  theme: ExerciseDarkTheme;
  totalRounds: number;
  showRoundsPicker: boolean;
  minRounds: number;
  maxRounds: number;
  onRoundsChange: (rounds: number) => void;
  showSettingsButton: boolean;
  onSettingsPress: () => void;
  /** False while a session runs — those controls move to the top glass row. */
  showButtonRow: boolean;
  showPrimaryButton: boolean;
  primaryIcon: 'play' | 'pause';
  onPrimaryPress: () => void;
}

export function GuidedBreathingHud({
  theme,
  totalRounds,
  showRoundsPicker,
  minRounds,
  maxRounds,
  onRoundsChange,
  showSettingsButton,
  onSettingsPress,
  showButtonRow,
  showPrimaryButton,
  primaryIcon,
  onPrimaryPress,
}: GuidedBreathingHudProps) {
  const { height } = useWindowDimensions();
  const compact = isShortScreen(height);

  return (
    <View style={[styles.bottomContainer, compact && styles.bottomContainerCompact]}>
      {showRoundsPicker ? (
        <RoundsHapticPicker
          value={totalRounds}
          min={minRounds}
          max={maxRounds}
          onChange={onRoundsChange}
          theme={theme}
        />
      ) : null}

      {showButtonRow ? (
        <View style={styles.btnRow}>
          {showSettingsButton ? (
            <SessionGlassButton
              theme={theme}
              icon="cog-outline"
              accessibilityLabel="Session options"
              size={SESSION_GLASS_CONTROL_SIZE}
              onPress={onSettingsPress}
            />
          ) : null}

          {showPrimaryButton ? (
            <SessionGlassButton
              theme={theme}
              icon={primaryIcon}
              accessibilityLabel={primaryIcon === 'play' ? 'Start' : 'Pause'}
              size={SESSION_GLASS_CONTROL_SIZE}
              onPress={onPrimaryPress}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing['4xl'],
  },
  // 56pt of bottom margin is a big share of a 667pt screen, and it pushes the
  // picker up into the intro copy. Give the space back to the centre stack.
  bottomContainerCompact: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
