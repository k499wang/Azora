import { Text } from '../common/Text';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Icon from '../common/icons/Icon';
import BlobCharacter from '../home/BlobCharacter';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const AVATAR_INNER_SIZE = 104;

interface ProfileIdentityCardProps {
  displayName: string;
  avatarUrl?: string | null;
  isUploading?: boolean;
  onChangePhoto?: () => void;
  onEditDisplayName?: () => void;
}

export default function ProfileIdentityCard({
  displayName,
  avatarUrl,
  isUploading = false,
  onChangePhoto,
  onEditDisplayName,
}: ProfileIdentityCardProps) {
  const canChangePhoto = onChangePhoto != null;
  const normalizedAvatarUrl = avatarUrl?.trim() || null;
  const hasAvatar = normalizedAvatarUrl != null;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Change profile photo"
        accessibilityRole="button"
        onPress={onChangePhoto}
        disabled={!canChangePhoto || isUploading}
        style={({ pressed }) => [
          styles.avatarShell,
          pressed && canChangePhoto && styles.avatarPressed,
        ]}
      >
        <View style={[styles.avatar, !hasAvatar && styles.avatarDefault]}>
          {normalizedAvatarUrl ? (
            <Image
              source={{ uri: normalizedAvatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <BlobCharacter
              character="calm"
              size={AVATAR_INNER_SIZE}
              bodyColor={colors.playful.sky.soft}
              faceColor={colors.playful.sky.ink}
            />
          )}
          {isUploading ? (
            <View style={styles.avatarUploading}>
              <ActivityIndicator color={colors.text.inverse} />
            </View>
          ) : null}
        </View>

        {canChangePhoto ? (
          <View style={styles.cameraBadge}>
            <Icon name="camera" size={16} color={colors.text.inverse} />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.nameRow}>
        {onEditDisplayName != null ? <View style={styles.editNameButton} /> : null}
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        {onEditDisplayName != null ? (
          <Pressable
            accessibilityLabel="Edit display name"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onEditDisplayName}
            style={({ pressed }) => [
              styles.editNameButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={18}
              color={colors.text.secondary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarShell: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.overlay.light,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.background.elevated,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  avatarPressed: {
    opacity: 0.92,
  },
  avatar: {
    width: AVATAR_INNER_SIZE,
    height: AVATAR_INNER_SIZE,
    borderRadius: AVATAR_INNER_SIZE / 2,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarDefault: {
    backgroundColor: colors.primary.blue100,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarUploading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay.dark,
  },
  cameraBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.elevated,
  },
  nameRow: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  name: {
    ...typography.title.title3,
    flexShrink: 1,
    color: colors.text.primary,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  editNameButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    opacity: 0.76,
  },
});
