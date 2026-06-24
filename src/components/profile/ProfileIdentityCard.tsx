import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Icon from '../common/icons/Icon';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface ProfileIdentityCardProps {
  displayName: string;
  avatarLabel: string;
  avatarUrl?: string | null;
  isUploading?: boolean;
  onChangePhoto?: () => void;
  onEditDisplayName?: () => void;
}

export default function ProfileIdentityCard({
  displayName,
  avatarLabel,
  avatarUrl,
  isUploading = false,
  onChangePhoto,
  onEditDisplayName,
}: ProfileIdentityCardProps) {
  const canChangePhoto = onChangePhoto != null;

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
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarLabel}>{avatarLabel}</Text>
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
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  avatarLabel: {
    ...typography.display.display3,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 30,
    lineHeight: 34,
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
