import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassSurface from '../../../../components/common/GlassSurface';
import Icon from '../../../../components/common/icons/Icon';
import { isHapticsEnabled } from '../../../../services/preferences/hapticsPreference';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { spacing } from '../../../../theme/spacing';

export const SESSION_GLASS_BUTTON_SIZE = 44;
/** The pre-session row sits on its own, so its controls run larger. */
export const SESSION_GLASS_CONTROL_SIZE = 64;

interface SessionGlassButtonProps {
  theme: ExerciseDarkTheme;
  icon: 'close' | 'play' | 'pause' | 'cog-outline';
  onPress: () => void;
  accessibilityLabel?: string;
  size?: number;
}

export function SessionGlassButton({
  theme,
  icon,
  onPress,
  accessibilityLabel,
  size = SESSION_GLASS_BUTTON_SIZE,
}: SessionGlassButtonProps) {
  const iconSize = Math.round(size * 0.45);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}
      hitSlop={spacing.sm}
    >
      <GlassSurface
        bare
        colorScheme={theme.id === 'light' ? 'light' : 'dark'}
        style={[
          styles.glass,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        pointerEvents="none"
      >
        {icon === 'close' ? (
          <Icon name="close" size={iconSize} color={theme.iconPrimary} />
        ) : (
          <MaterialCommunityIcons
            name={icon}
            size={iconSize}
            color={theme.iconPrimary}
          />
        )}
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  glass: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
