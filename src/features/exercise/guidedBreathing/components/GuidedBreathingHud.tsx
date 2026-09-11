import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { spacing } from '../../../../theme/spacing';
import { isShortScreen } from '../../../../theme/breakpoints';
import { SessionLipButton } from '../../shared/components/SessionLipButton';

interface GuidedBreathingHudProps {
  theme: ExerciseDarkTheme;
  showSettingsButton: boolean;
  onSettingsPress: () => void;
  /** False while a session runs — those controls move to the top glass row. */
  showButtonRow: boolean;
  showPrimaryButton: boolean;
  primaryIcon: 'play' | 'pause';
  /** A pro-only session length is selected, so the primary button is the gate. */
  upgradeRequired: boolean;
  onPrimaryPress: () => void;
}

export function GuidedBreathingHud({
  theme,
  showSettingsButton,
  onSettingsPress,
  showButtonRow,
  showPrimaryButton,
  primaryIcon,
  upgradeRequired,
  onPrimaryPress,
}: GuidedBreathingHudProps) {
  const { height } = useWindowDimensions();
  const compact = isShortScreen(height);

  return (
    <View style={[styles.bottomContainer, compact && styles.bottomContainerCompact]}>
      {showButtonRow ? (
        <View style={styles.btnRow}>
          {showSettingsButton ? (
            <SessionLipButton
              theme={theme}
              icon="cog-outline"
              label="Session options"
              onPress={onSettingsPress}
            />
          ) : null}

          {showPrimaryButton ? (
            <SessionLipButton
              theme={theme}
              icon={upgradeRequired ? 'lock-outline' : 'play'}
              label={
                upgradeRequired
                  ? 'Upgrade'
                  : primaryIcon === 'play'
                    ? 'Start'
                    : 'Pause'
              }
              onPress={onPrimaryPress}
              primary
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    alignItems: 'stretch',
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
    width: '100%',
    gap: spacing.md,
  },
});
