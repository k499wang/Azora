import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProfileScreenProps } from '../app/navigation';
import CollapsingTitleBar, {
  useCollapsingContentInset,
  useCollapsingTitle,
} from '../components/common/CollapsingTitleBar';
import GlassIconButton from '../components/common/GlassIconButton';
import ScreenContent from '../components/common/ScreenContent';
import SectionHeader from '../components/common/SectionHeader';
import TabTitleRow from '../components/common/TabTitleRow';
import { Text } from '../components/common/Text';
import ProfileCompletionCalendarCard from '../components/profile/ProfileCompletionCalendarCard';
import ProfileDisplayNameEditorDialog from '../components/profile/ProfileDisplayNameEditorDialog';
import ProfileIdentityCard from '../components/profile/ProfileIdentityCard';
import PlanAnalyticsSection from '../features/plan/PlanAnalyticsSection';
import { factorEffects, moodTrend, resetEffect } from '../features/plan/domain/moodAnalytics';
import { weeklyReview } from '../features/plan/domain/weeklyReview';
import HotelEntryCard from '../features/room/HotelEntryCard';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';
import { useProfileEditing } from '../hooks/useProfileEditing';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { balanceOf } from '../lib/wallet/coins';
import { useRecentMoodCheckInsQuery } from '../queries/mood/useRecentMoodCheckInsQuery';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { useDailyActivityRangeQuery } from '../queries/tracking/useDailyActivityRangeQuery';
import { useWalletQuery } from '../queries/wallet/useWalletQuery';
import { trackProfileAction } from '../services/analytics/tracking';
import { triggerTapHaptic } from '../native/tapHaptics';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';

const TAB_BAR_HEIGHT = 49;
/** A month of mood: long enough to show a shape, short enough to read. */
const TREND_DAYS = 30;
/** Eight weeks of activity rows support the reset comparison. */
const ACTIVITY_DAYS = 56;

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingTitle();
  const contentInset = useCollapsingContentInset();
  const isRegularWidth = useIsRegularWidth();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const profileSummary = useProfileSummaryQuery(userId).data;
  const walletEntries = useWalletQuery(userId).data;
  const coins = walletEntries == null ? undefined : balanceOf(walletEntries);
  const moodCheckInsQuery = useRecentMoodCheckInsQuery(userId, 62);
  const activityQuery = useDailyActivityRangeQuery(userId, ACTIVITY_DAYS);
  const todayLocalDate = useTodayLocalDate();
  const profileEditing = useProfileEditing(userId);
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const review = useMemo(
    () => weeklyReview(activityQuery.data ?? [], moodCheckInsQuery.data ?? [], todayLocalDate),
    [activityQuery.data, moodCheckInsQuery.data, todayLocalDate],
  );
  const reset = useMemo(
    () => resetEffect(moodCheckInsQuery.data ?? [], activityQuery.data ?? [], ACTIVITY_DAYS),
    [activityQuery.data, moodCheckInsQuery.data],
  );
  const factors = useMemo(
    () => factorEffects(moodCheckInsQuery.data ?? []),
    [moodCheckInsQuery.data],
  );
  const trend = useMemo(
    () => moodTrend(moodCheckInsQuery.data ?? [], todayLocalDate, TREND_DAYS),
    [moodCheckInsQuery.data, todayLocalDate],
  );

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: contentInset, paddingBottom: tabBarHeight + spacing.xl },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent width="grouped">
          <TabTitleRow
            title="Profile"
            action={
              <GlassIconButton
                accessibilityLabel="Open settings"
                size={46}
                variant="regular"
                onPress={() => {
                  trackProfileAction('settings_opened');
                  navigation.navigate('Settings');
                }}
              >
                <Ionicons name="settings-outline" size={24} color={colors.text.secondary} />
              </GlassIconButton>
            }
          />
        </ScreenContent>

        <ScreenContent width="grouped" style={styles.column}>
          <View style={styles.profileSummarySection}>
            <ProfileIdentityCard
              displayName={profileSummary?.profile?.displayName ?? '—'}
              avatarUrl={profileSummary?.profile?.avatarUrl}
              coins={coins}
              totalSessions={profileSummary?.totalSessions ?? 0}
              currentStreak={profileSummary?.currentStreak ?? 0}
              isUploading={profileEditing.isUploading}
              onChangePhoto={profileEditing.changePhoto}
              onEditDisplayName={profileEditing.editDisplayName}
            />

            <HotelEntryCard />
          </View>

          <View style={styles.insightsSection}>
            <SectionHeader icon="stat-health-spark" title="Insights" />
            <PlanAnalyticsSection
              review={review}
              daysAnswered={moodCheckInsQuery.data?.length ?? 0}
              trend={trend}
              reset={reset}
              factors={factors}
            />
          </View>

          <View style={styles.consistencySection}>
            <SectionHeader
              title="Consistency"
              right={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open your history"
                  hitSlop={spacing.sm}
                  onPress={() => {
                    triggerTapHaptic();
                    navigation.navigate('History');
                  }}
                >
                  <Text style={styles.historyLink}>See all</Text>
                </Pressable>
              }
            />
            <ProfileCompletionCalendarCard
              completedDays={profileSummary?.completedDays ?? []}
              moodEntries={moodCheckInsQuery.data ?? []}
              onSelectDay={(date) => navigation.navigate('History', { date })}
            />
          </View>
        </ScreenContent>
      </Animated.ScrollView>

      <CollapsingTitleBar title="Profile" scrollY={scrollY} />

      <ProfileDisplayNameEditorDialog
        visible={profileEditing.editingDisplayName}
        displayName={profileSummary?.profile?.displayName ?? '—'}
        isSaving={profileEditing.isSaving}
        onCancel={profileEditing.cancelEditingDisplayName}
        onSave={profileEditing.saveDisplayName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  scroll: { flex: 1 },
  content: {},
  column: {
    gap: spacing.xl,
    paddingHorizontal: padding.screen.horizontal,
  },
  profileSummarySection: {
    gap: spacing.md,
  },
  consistencySection: {
    gap: spacing.lg,
  },
  insightsSection: {
    gap: spacing.md,
  },
  historyLink: { color: colors.text.brand },
});
