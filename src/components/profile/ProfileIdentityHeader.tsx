import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import ProfileAvatarImage from '../common/ProfileAvatarImage';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const AVATAR_SHELL_SIZE = 128;
const AVATAR_INNER_SIZE = 104;

interface ProfileIdentityHeaderProps {
  displayName: string;
  avatarUrl?: string | null;
  joinedLabel?: string;
  isUploading?: boolean;
  onChangePhoto?: () => void;
  onEditDisplayName?: () => void;
}

export default function ProfileIdentityHeader({
  displayName,
  avatarUrl,
  joinedLabel,
  isUploading = false,
  onChangePhoto,
  onEditDisplayName,
}: ProfileIdentityHeaderProps) {
  const canChangePhoto = onChangePhoto != null;

  return (
    <View style={styles.root}>
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
        <View style={styles.avatar}>
          <ProfileAvatarImage avatarUrl={avatarUrl} size={AVATAR_INNER_SIZE} />
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

      <View style={styles.identity}>
        <View style={styles.nameRow}>
          {onEditDisplayName != null ? <View style={styles.editNameButton} /> : null}
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {onEditDisplayName != null ? (
            <Pressable
              accessibilityLabel="Edit display name"
              accessibilityRole="button"
              hitSlop={spacing.sm}
              onPress={onEditDisplayName}
              style={({ pressed }) => [styles.editNameButton, pressed && styles.iconButtonPressed]}
            >
              <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.text.secondary} />
            </Pressable>
          ) : null}
        </View>
        {joinedLabel == null ? null : <Text style={styles.joined}>{joinedLabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarShell: {
    width: AVATAR_SHELL_SIZE,
    height: AVATAR_SHELL_SIZE,
    borderRadius: AVATAR_SHELL_SIZE / 2,
    backgroundColor: colors.background.elevated,
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    backgroundColor: colors.primary.blue500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.elevated,
  },
  identity: {
    maxWidth: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nameRow: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    flexShrink: 1,
    color: colors.text.primary,
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
  joined: {
    ...typography.label.medium,
    color: colors.text.secondary,
  },
});
