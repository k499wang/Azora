import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassSurface from '../../../../components/common/GlassSurface';
import Icon from '../../../../components/common/icons/Icon';
import { isHapticsEnabled } from '../../../../services/preferences/hapticsPreference';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { spacing } from '../../../../theme/spacing';

export const SESSION_GLASS_BUTTON_SIZE = 44;

interface SessionGlassButtonProps {
  theme: ExerciseDarkTheme;
  icon: 'close' | 'play' | 'pause';
  onPress: () => void;
}

export function SessionGlassButton({
  theme,
  icon,
  onPress,
}: SessionGlassButtonProps) {
  return (
    <Pressable
      onPress={() => {
        if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      hitSlop={spacing.sm}
    >
      <GlassSurface
        bare
        colorScheme={theme.id === 'light' ? 'light' : 'dark'}
        style={styles.glass}
        pointerEvents="none"
      >
        {icon === 'close' ? (
          <Icon name="close" size={20} color={theme.iconPrimary} />
        ) : (
          <MaterialCommunityIcons name={icon} size={20} color={theme.iconPrimary} />
        )}
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: SESSION_GLASS_BUTTON_SIZE,
    height: SESSION_GLASS_BUTTON_SIZE,
    borderRadius: SESSION_GLASS_BUTTON_SIZE / 2,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  glass: {
    width: SESSION_GLASS_BUTTON_SIZE,
    height: SESSION_GLASS_BUTTON_SIZE,
    borderRadius: SESSION_GLASS_BUTTON_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
