import { Pressable, StyleSheet, View } from 'react-native';
import { GLASS_ICON_BUTTON_SIZE } from './GlassIconButton';
import ProfileAvatarImage from './ProfileAvatarImage';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { triggerTapHaptic } from '../../native/tapHaptics';

const AVATAR_SIZE = GLASS_ICON_BUTTON_SIZE;

interface TopBarAvatarProps {
  avatarUrl?: string | null;
  onPress: () => void;
}

export default function TopBarAvatar({ avatarUrl, onPress }: TopBarAvatarProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      hitSlop={10}
      style={({ pressed }) => [styles.shell, pressed && styles.pressed]}
    >
      <View style={styles.clip}>
        <ProfileAvatarImage avatarUrl={avatarUrl} size={AVATAR_SIZE} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    ...card.shadowElevated,
  },
  clip: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glass.edge,
  },
  pressed: pressable.control,
});
