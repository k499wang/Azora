import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../common/Text';
import HoldProgressBar from './HoldProgressBar';
import { SettingsGearButton } from '../../features/audioSettings';
import type { DailyBreathHoldPhase } from '../../lib/breathHoldPhases';
import type { ExerciseDarkTheme } from '../../theme/exerciseDarkThemes';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface DailyBreathHoldHudProps {
  phase: DailyBreathHoldPhase;
  theme: ExerciseDarkTheme;
  holdSeconds: number;
  bestHoldSeconds: number;
  onSettingsPress: () => void;
  onCancelPlacement: () => void;
  onStop: () => void;
  onStart: () => void;
  onViewResults: () => void;
}

export function DailyBreathHoldHud({
  phase,
  theme,
  holdSeconds,
  bestHoldSeconds,
  onSettingsPress,
  onCancelPlacement,
  onStop,
  onStart,
  onViewResults,
}: DailyBreathHoldHudProps) {
  const isPlacement = phase === 'placement';
  const showSettings = phase === 'idle' || phase === 'done';
  const showPrimaryControls = showSettings || isPlacement;
  const primaryLabel = phase === 'idle' ? 'Start' : 'Try Again';

  return (
    <View style={styles.container}>
      {phase === 'hold' ? (
        <HoldProgressBar
          holdSeconds={holdSeconds}
          bestSeconds={bestHoldSeconds}
          textColor={theme.textPrimary}
          trackColor={theme.surface}
          fillColor={theme.textAccent}
        />
      ) : null}

      {showSettings ? (
        <SettingsGearButton
          onPress={onSettingsPress}
          label="Session options"
          iconName="tune-variant"
          color={theme.textPrimary}
          backgroundColor={theme.surface}
          borderColor={theme.surfaceBorder}
          style={styles.settingsPill}
        />
      ) : null}

      {showPrimaryControls ? (
        <View style={styles.buttonRow}>
          {isPlacement ? (
            <Pressable
              style={({ pressed }) => [
                styles.squareButton,
                { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
                pressed && styles.buttonPressed,
              ]}
              onPress={onCancelPlacement}
              accessibilityLabel="Cancel"
            >
              <MaterialCommunityIcons
                name="close"
                size={26}
                color={theme.iconPrimary}
              />
            </Pressable>
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.squareButton,
                  { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
                  pressed && styles.buttonPressed,
                ]}
                onPress={onStop}
                accessibilityLabel="Stop"
              >
                <MaterialCommunityIcons
                  name="stop"
                  size={26}
                  color={theme.iconPrimary}
                />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.circleButton,
                  { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
                  pressed && styles.buttonPressed,
                ]}
                onPress={onStart}
                accessibilityLabel={primaryLabel}
              >
                <MaterialCommunityIcons
                  name="play"
                  size={28}
                  color={theme.iconPrimary}
                />
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      <Pressable
        pointerEvents={phase === 'done' ? 'auto' : 'none'}
        style={({ pressed }) => [
          styles.viewResultsButton,
          { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
          pressed && styles.buttonPressed,
          phase !== 'done' && styles.viewResultsHidden,
        ]}
        onPress={onViewResults}
      >
        <MaterialCommunityIcons
          name="chart-line"
          size={18}
          color={theme.textAccent}
          style={styles.viewResultsIcon}
        />
        <Text style={[styles.viewResultsText, { color: theme.textPrimary }]}>
          View Results
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  settingsPill: {
    alignSelf: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  squareButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  circleButton: {
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
  viewResultsHidden: {
    opacity: 0,
  },
  viewResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.accentSoft,
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary.blue400,
  },
  viewResultsIcon: {
    marginRight: spacing.xs,
  },
  viewResultsText: {
    ...typography.button.large,
    color: colors.primary.blue600,
  },
});
