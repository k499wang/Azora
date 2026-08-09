import { ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Text } from './Text';
import Icon from './icons/Icon';
import TopBarAvatar from './TopBarAvatar';
import TopBarStreak from './TopBarStreak';
import TopBarGeometry from './TopBarGeometry';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { useProfileSummaryQuery } from '../../queries/profile/useProfileSummaryQuery';
import { useAuthStore } from '../../stores/authStore';
import type { MainTabNavigationProp } from '../../app/navigation';

const TOP_BAR_HEIGHT = 58;
const CURVE_HEIGHT = 26;
const OVERSCROLL_FILL_HEIGHT = 600;

interface AppTopBarProps {
  title?: string;
  /** renders a back chevron when there is somewhere to go back to */
  showBack?: boolean;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  showAvatar?: boolean;
  showStreak?: boolean;
  tinted?: boolean;
  children?: ReactNode;
}

export default function AppTopBar({
  title,
  showBack = false,
  leftSlot,
  rightSlot,
  showAvatar = true,
  showStreak = true,
  tinted = false,
  children,
}: AppTopBarProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const needsProfile = showAvatar || showStreak;
  const profileSummary = useProfileSummaryQuery(needsProfile ? userId : null).data;

  const openProfile = () => navigation.navigate('Profile');
  const canGoBack = showBack && navigation.canGoBack();
  const showBar =
    canGoBack ||
    title != null ||
    leftSlot != null ||
    rightSlot != null ||
    showAvatar ||
    showStreak;

  return (
    <View>
      <View
        style={[
          tinted && styles.surface,
          { paddingTop: insets.top },
        ]}
      >
        {tinted && <View style={styles.overscrollFill} />}
        {tinted && <TopBarGeometry extendTop={OVERSCROLL_FILL_HEIGHT} />}
        {showBar && (
          <View style={styles.bar}>
            <View style={styles.leftSide}>
              {canGoBack && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  hitSlop={spacing.md}
                  style={styles.back}
                  onPress={() => navigation.goBack()}
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
              {showStreak && (
                <TopBarStreak
                  streakDays={profileSummary?.currentStreak ?? 0}
                  onPress={openProfile}
                />
              )}
            </View>
            <View style={styles.rightSide}>
              {rightSlot}
              {showAvatar && (
                <TopBarAvatar
                  avatarUrl={profileSummary?.profile?.avatarUrl}
                  onPress={openProfile}
                />
              )}
            </View>
          </View>
        )}
        {children}
      </View>
      {tinted && (
        <Svg width={width} height={CURVE_HEIGHT} style={styles.curve}>
          <Path
            d={`M0 0 H${width} Q${width / 2} ${CURVE_HEIGHT * 2} 0 0 Z`}
            fill={colors.background.headerTint}
          />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.background.headerTint,
  },
  curve: {
    marginTop: -StyleSheet.hairlineWidth,
  },
  overscrollFill: {
    position: 'absolute',
    top: -OVERSCROLL_FILL_HEIGHT,
    left: 0,
    right: 0,
    height: OVERSCROLL_FILL_HEIGHT,
    backgroundColor: colors.background.headerTint,
  },
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
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
