import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GlassIconButton from './GlassIconButton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { triggerTapHaptic } from '../../native/tapHaptics';

export const CLOSE_BUTTON_SIZE = 44;

interface CloseButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
  /** Screen-owned positioning. */
  style?: StyleProp<ViewStyle>;
  /** Render the on-block variant (translucent white circle + white icon) for colored header blocks. */
  onBlock?: boolean;
}

/**
 * The app's single close affordance. Floating screens get the frosted glass
 * circle; colored header blocks pass `onBlock` so the circle stays translucent
 * white and the icon white regardless of the glass fallback mode.
 */
export default function CloseButton({
  onPress,
  accessibilityLabel = 'Close',
  style,
  onBlock = false,
}: CloseButtonProps) {
  if (onBlock) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={spacing.sm}
        onPress={() => {
          triggerTapHaptic();
          onPress();
        }}
        style={({ pressed }) => [styles.onBlock, style, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons
          name="close"
          size={20}
          color={colors.text.inverse}
        />
      </Pressable>
    );
  }

  return (
    <GlassIconButton
      accessibilityLabel={accessibilityLabel}
      size={CLOSE_BUTTON_SIZE}
      onPress={onPress}
      style={style}
    >
      <MaterialCommunityIcons
        name="close"
        size={20}
        color={colors.text.secondary}
      />
    </GlassIconButton>
  );
}

const styles = StyleSheet.create({
  onBlock: {
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    borderRadius: CLOSE_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onBlock.fill,
  },
  pressed: {
    opacity: 0.7,
  },
});
