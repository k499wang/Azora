import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import Icon from './icons/Icon';
import TopBarAvatar from './TopBarAvatar';
import TopBarStreak from './TopBarStreak';
import GlassIconButton from './GlassIconButton';
import NotificationsSettingsSheet from '../../features/notifications/NotificationsSettingsSheet';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { useProfileSummaryQuery } from '../../queries/profile/useProfileSummaryQuery';
import { useAuthStore } from '../../stores/authStore';
import type { MainTabNavigationProp } from '../../app/navigation';
import { openProfile } from '../../app/navigation/openProfile';

const TOP_BAR_HEIGHT = 58;

interface AppTopBarProps {
  title?: string;
  /** renders a back chevron when there is somewhere to go back to */
  showBack?: boolean;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  showAvatar?: boolean;
  /** a bell beside the avatar that opens the notification settings sheet */
  showNotifications?: boolean;
  showStreak?: boolean;
  children?: ReactNode;
}

export default function AppTopBar({
  title,
  showBack = false,
  leftSlot,
  rightSlot,
  showAvatar = true,
  showNotifications = false,
  showStreak = true,
  children,
}: AppTopBarProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const needsProfile = showAvatar || showStreak;
  const profileSummary = useProfileSummaryQuery(needsProfile ? userId : null).data;

  const [notificationsVisible, setNotificationsVisible] = useState(false);

  const handleOpenProfile = () => openProfile(navigation);
  const canGoBack = showBack && navigation.canGoBack();
  const showBar =
    canGoBack ||
    title != null ||
    leftSlot != null ||
    rightSlot != null ||
    showAvatar ||
    showNotifications ||
    showStreak;

  return (
    <View>
      <View style={{ paddingTop: insets.top }}>
        {showBar && (
          <View style={styles.bar}>
            <View style={styles.leftSide}>
              {canGoBack && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  hitSlop={spacing.md}
                  style={({ pressed }) => [
                    styles.back,
                    pressed && styles.backPressed,
                  ]}
                  onPress={() => {
                    triggerTapHaptic();
                    navigation.goBack();
                  }}
                >
                  <Icon
                    name="chevron-left"
                    size={26}
                    color={colors.text.primary}
                  />
                </Pressable>
              )}
              {title != null && <Text style={styles.title}>{title}</Text>}
              {leftSlot}
              {showNotifications && (
                <GlassIconButton
                  accessibilityLabel="Open notification settings"
                  size={48}
                  onPress={() => setNotificationsVisible(true)}
                >
                  <Icon name="bell" size={26} color={colors.text.secondary} />
                </GlassIconButton>
              )}
              {showStreak && (
                <TopBarStreak
                  streakDays={profileSummary?.currentStreak ?? 0}
                  onPress={handleOpenProfile}
                />
              )}
            </View>
            <View style={styles.rightSide}>
              {rightSlot}
              {showAvatar && (
                <TopBarAvatar
                  avatarUrl={profileSummary?.profile?.avatarUrl}
                  onPress={handleOpenProfile}
                />
              )}
            </View>
          </View>
        )}
        {children}
      </View>
      {showNotifications && (
        <NotificationsSettingsSheet
          visible={notificationsVisible}
          userId={userId}
          onClose={() => setNotificationsVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: TOP_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  back: {
    marginLeft: -spacing.xs,
    marginRight: spacing.xs,
  },
  backPressed: pressable.control,
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
