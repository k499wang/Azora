import { Text } from '../../../../components/common/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { SettingsGearButton } from '../../../audioSettings';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { fonts, typography } from '../../../../theme/typography';
import Icon from '../../../../components/common/icons/Icon';
import RoundsHapticPicker from './RoundsHapticPicker';

interface GuidedBreathingHudProps {
  theme: ExerciseDarkTheme;
  showProgress: boolean;
  progress: number;
  currentRound: number;
  totalRounds: number;
  showRoundsPicker: boolean;
  minRounds: number;
  maxRounds: number;
  onRoundsChange: (rounds: number) => void;
  showSettingsButton: boolean;
  onSettingsPress: () => void;
  showPrimaryButton: boolean;
  primaryIcon: 'play' | 'pause';
  onPrimaryPress: () => void;
  onClosePress: () => void;
}

export function GuidedBreathingHud({
  theme,
  showProgress,
  progress,
  currentRound,
  totalRounds,
  showRoundsPicker,
  minRounds,
  maxRounds,
  onRoundsChange,
  showSettingsButton,
  onSettingsPress,
  showPrimaryButton,
  primaryIcon,
  onPrimaryPress,
  onClosePress,
}: GuidedBreathingHudProps) {
  return (
    <View style={styles.bottomContainer}>
      {showProgress ? (
        <View style={styles.progressWrap}>
          <View style={[styles.progressTrack, { backgroundColor: theme.progressTrack }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: theme.progressFill,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: theme.textTertiary }]}>
            Round {Math.min(currentRound, totalRounds)} of {totalRounds}
          </Text>
        </View>
      ) : showRoundsPicker ? (
        <RoundsHapticPicker
          value={totalRounds}
          min={minRounds}
          max={maxRounds}
          onChange={onRoundsChange}
          theme={theme}
        />
      ) : null}

      <View style={styles.btnRow}>
        <Pressable
          style={({ pressed }) => [
            styles.exitBtn,
            { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
            pressed && styles.circleBtnPressed,
          ]}
          onPress={onClosePress}
        >
          <Icon name="close" size={26} color={theme.iconPrimary} />
        </Pressable>

        {showSettingsButton ? (
          <SettingsGearButton
            onPress={onSettingsPress}
            label="Session options"
            iconName="tune-variant"
            color={theme.iconPrimary}
            backgroundColor={theme.surface}
            borderColor={theme.surfaceBorder}
            size={64}
          />
        ) : null}

        {showPrimaryButton ? (
          <Pressable
            style={({ pressed }) => [
              styles.circleBtn,
              { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
              pressed && styles.circleBtnPressed,
            ]}
            onPress={onPrimaryPress}
          >
            <MaterialCommunityIcons
              name={primaryIcon}
              size={28}
              color={theme.iconPrimary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing['4xl'],
  },
  progressWrap: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  progressTrack: {
    width: '100%',
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border.subtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.blue400,
    opacity: 0.6,
    borderRadius: 1,
  },
  progressLabel: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
    opacity: 0.6,
    letterSpacing: 1,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  exitBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  circleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  circleBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
