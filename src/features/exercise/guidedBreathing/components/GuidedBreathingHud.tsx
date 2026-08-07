import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SettingsGearButton } from '../../../audioSettings';
import { isHapticsEnabled } from '../../../../services/preferences/hapticsPreference';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { isShortScreen } from '../../../../theme/breakpoints';
import Icon from '../../../../components/common/icons/Icon';
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
  onClosePress: () => void;
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
  onClosePress,
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
          <Pressable
            style={({ pressed }) => [
              styles.exitBtn,
              { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
              pressed && styles.circleBtnPressed,
            ]}
            onPress={() => {
              if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
              onClosePress();
            }}
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
              onPress={() => {
                if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
                onPrimaryPress();
              }}
            >
              <MaterialCommunityIcons
                name={primaryIcon}
                size={28}
                color={theme.iconPrimary}
              />
            </Pressable>
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
