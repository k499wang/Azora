import { Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';

interface SettingsGearButtonProps {
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_SIZE = 48;

export default function SettingsGearButton({
  onPress,
  color = colors.text.primary,
  backgroundColor = colors.background.elevated,
  borderColor = colors.border.subtle,
  size = DEFAULT_SIZE,
  style,
}: SettingsGearButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Session settings"
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderColor,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon name="settings" size={Math.round(size * 0.55)} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
