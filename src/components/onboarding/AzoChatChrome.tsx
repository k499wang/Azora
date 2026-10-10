import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from '../common/icons/Icon';
import { colors } from '../../theme/colors';

// This opening follows the reference's white, gray, and green messaging surfaces.
export const azoChatColors = {
  background: colors.neutral[0],
  ink: colors.neutral[900],
  muted: '#949494',
  bubble: '#ECECEC',
  reply: '#F2FFE6',
  green: '#79B34B',
  greenInk: '#527A32',
  greenLip: '#58883B',
};

export function AzoChatAvatar({ size = 48 }: { size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size }]}>
      <Image
        source={require('../../../assets/mascot/azo-head.png')}
        style={styles.image}
        contentFit="contain"
        accessible={false}
      />
    </View>
  );
}

export function AzoChatBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
    >
      <Icon name="chevron-left" size={26} color={azoChatColors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 13,
    backgroundColor: colors.primary.blue100,
    padding: 3,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: azoChatColors.bubble,
  },
  pressed: { opacity: 0.65 },
});
