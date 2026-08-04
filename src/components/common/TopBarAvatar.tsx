import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import GlassIconButton, { GLASS_ICON_BUTTON_SIZE } from './GlassIconButton';
import Icon from './icons/Icon';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';

const AVATAR_SIZE = GLASS_ICON_BUTTON_SIZE;

interface TopBarAvatarProps {
  avatarUrl?: string | null;
  onPress: () => void;
}

export default function TopBarAvatar({ avatarUrl, onPress }: TopBarAvatarProps) {
  const normalizedAvatarUrl = avatarUrl?.trim() || null;

  if (normalizedAvatarUrl == null) {
    return (
      <GlassIconButton accessibilityLabel="Open profile" onPress={onPress}>
        <Icon name="profile" size={20} color={colors.text.secondary} />
      </GlassIconButton>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.shell, pressed && styles.pressed]}
    >
      <View style={styles.clip}>
        <Image
          source={{ uri: normalizedAvatarUrl }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
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
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
