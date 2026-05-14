import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface ProfileIdentityCardProps {
  displayName: string;
  avatarLabel: string;
  avatarUrl?: string | null;
  onChangePhoto?: () => void;
}

export default function ProfileIdentityCard({
  displayName,
  avatarLabel,
  avatarUrl,
  onChangePhoto,
}: ProfileIdentityCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerCopy}>
        <Text style={styles.name}>{displayName}</Text>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatarShell}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLabel}>{avatarLabel}</Text>
            )}
          </View>
        </View>

        <Pressable
          onPress={onChangePhoto}
          disabled={onChangePhoto == null}
          style={({ pressed }) => [
            styles.changePhotoButton,
            pressed && onChangePhoto != null && styles.changePhotoPressed,
            onChangePhoto == null && styles.changePhotoDisabled,
          ]}
        >
          <MaterialCommunityIcons name="camera-outline" size={14} color={colors.primary.blue700} />
          <Text style={styles.changePhotoText}>Change photo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarSection: {
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
  avatarLabel: {
    ...typography.display.display3,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 30,
    lineHeight: 34,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.overlay.light,
    borderWidth: 1,
    borderColor: colors.border.brand,
  },
  changePhotoPressed: {
    opacity: 0.92,
  },
  changePhotoDisabled: {
    opacity: 0.7,
  },
  changePhotoText: {
    ...typography.label.medium,
    color: colors.primary.blue700,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  headerCopy: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.title.title3,
    color: colors.text.primary,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
});
