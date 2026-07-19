import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../../../../components/common/Text';
import HoldProgressBar from './HoldProgressBar';
import { SettingsGearButton } from '../../../audioSettings';
import {
  isBreathHoldBreathingPhase,
  type DailyBreathHoldPhase,
} from '../domain/breathHoldPhases';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';

interface DailyBreathHoldHudProps {
  phase: DailyBreathHoldPhase;
  paused: boolean;
  theme: ExerciseDarkTheme;
  holdSeconds: number;
  bestHoldSeconds: number;
  onSettingsPress: () => void;
  onExit: () => void;
  onStart: () => void;
  onPauseResume: () => void;
  onViewResults: () => void;
}

export function DailyBreathHoldHud({
  phase,
  paused,
  theme,
  holdSeconds,
  bestHoldSeconds,
  onSettingsPress,
  onExit,
  onStart,
  onPauseResume,
  onViewResults,
}: DailyBreathHoldHudProps) {
  const showSettings = phase === 'idle' || phase === 'done';
  const showStart = phase === 'idle' || phase === 'done';
  const canPause = isBreathHoldBreathingPhase(phase) || phase === 'hold';
  const showControls = showStart || canPause || phase === 'placement' || phase === 'intro';
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

      {showControls ? (
        <View style={styles.buttonRow}>
          <ControlButton
            icon="close"
            label="Exit"
            theme={theme}
            onPress={onExit}
          />
          {showStart ? (
            <ControlButton
              icon="play"
              label={primaryLabel}
              theme={theme}
              onPress={onStart}
            />
          ) : canPause ? (
            <ControlButton
              icon={paused ? 'play' : 'pause'}
              label={paused ? 'Resume' : 'Pause'}
              theme={theme}
              onPress={onPauseResume}
            />
          ) : null}
        </View>
      ) : null}

      {phase === 'done' ? (
        <Pressable
          style={({ pressed }) => [
            styles.viewResultsButton,
            { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
            pressed && styles.buttonPressed,
          ]}
          onPress={onViewResults}
        >
          <MaterialCommunityIcons
            name="chart-line"
            size={18}
            color={theme.textAccent}
            style={styles.viewResultsIcon}
          />
          <Text style={[styles.viewResultsText, { color: theme.textPrimary }]}>View Results</Text>
        </Pressable>
      ) : null}
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
      onPress={onPress}
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
