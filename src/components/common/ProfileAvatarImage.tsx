import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Icon from './icons/Icon';
import { colors } from '../../theme/colors';

interface ProfileAvatarImageProps {
  avatarUrl?: string | null;
  size: number;
}

export default function ProfileAvatarImage({ avatarUrl, size }: ProfileAvatarImageProps) {
  const uri = avatarUrl?.trim() || null;

  if (uri != null) {
    return (
      <Image
        source={{ uri }}
        style={styles.fill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View style={[styles.fill, styles.placeholder]}>
      <Icon name="person-silhouette" size={size * 0.86} color={colors.neutral[400]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: colors.neutral[200],
  },
});
