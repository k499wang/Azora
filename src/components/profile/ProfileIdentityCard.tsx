import { Text } from '../common/Text';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Icon from '../common/icons/Icon';
import { DEFAULT_PROFILE_AVATAR_SOURCE } from '../../data/profileAssets';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import { formatProfileCount } from '../../lib/profileStatsFormat';

const AVATAR_INNER_SIZE = 104;

// `adjustsFontSizeToFit` on iOS shrinks against the height it is given as well
// as the width, so one line of the drawn size is the box the value may fill.
const STAT_VALUE_LINE_HEIGHT = 33;

interface ProfileLifetimeStat {
  label: string;
  value: string;
}

interface ProfileIdentityCardProps {
  displayName: string;
  avatarUrl?: string | null;
  totalBreaths: number;
  totalSessions: number;
  currentStreak: number;
  isUploading?: boolean;
  onChangePhoto?: () => void;
  onEditDisplayName?: () => void;
}

/**
 * Two lifetime totals and where the user is right now.
 *
 * The streak replaced held time, which was the one figure here nobody could
 * act on: it only ever rose, it rose fastest for whoever had been here
 * longest, and it said nothing about this week. The streak used to be a pill
 * in the top bar; the bar is a title now, so the number lives with the other
 * numbers.
 */
function buildLifetimeStats(
  totalBreaths: number,
  totalSessions: number,
  currentStreak: number,
): ProfileLifetimeStat[] {
  return [
    { label: 'Breaths', value: formatProfileCount(totalBreaths) },
    { label: 'Sessions', value: formatProfileCount(totalSessions) },
    { label: 'Streak', value: formatProfileCount(currentStreak) },
  ];
}

export default function ProfileIdentityCard({
  displayName,
  avatarUrl,
  totalBreaths,
  totalSessions,
  currentStreak,
  isUploading = false,
  onChangePhoto,
  onEditDisplayName,
}: ProfileIdentityCardProps) {
  const canChangePhoto = onChangePhoto != null;
  const normalizedAvatarUrl = avatarUrl?.trim() || null;
  const hasAvatar = normalizedAvatarUrl != null;
  const lifetimeStats = buildLifetimeStats(
    totalBreaths,
    totalSessions,
    currentStreak,
  );

  return (
    <View style={styles.cardShadow}>
      <View style={styles.card}>
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
            <Image
              source={
                normalizedAvatarUrl
                  ? { uri: normalizedAvatarUrl }
                  : DEFAULT_PROFILE_AVATAR_SOURCE
              }
              style={styles.avatarImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
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

        <View style={styles.statsRow}>
          {lifetimeStats.map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={styles.statLabel} numberOfLines={1}>
                {stat.label}
              </Text>
              <Text
                style={styles.statValue}
                accessibilityLabel={stat.value}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {stat.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    ...card.blockShadow,
  },
  card: {
    ...card.block,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
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
    backgroundColor: colors.primary.blue500,
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
    backgroundColor: colors.primary.blue500,
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
  statsRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.label.large,
    color: colors.text.secondary,
    fontFamily: fonts.medium,
  },
  statValue: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    fontSize: 28,
    lineHeight: STAT_VALUE_LINE_HEIGHT,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    color: colors.text.primary,
  },
});
