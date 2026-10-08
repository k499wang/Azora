import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProfileScreenProps } from '../app/navigation';
import CollapsingTitleBar, {
  useCollapsingContentInset,
  useCollapsingTitle,
} from '../components/common/CollapsingTitleBar';
import GlassIconButton from '../components/common/GlassIconButton';
import TabTitleRow from '../components/common/TabTitleRow';
import TaskIllustration from '../components/common/icons/TaskIllustration';
import ScreenContent from '../components/common/ScreenContent';
import SectionHeader from '../components/common/SectionHeader';
import ProfileCompletionCalendarCard from '../components/profile/ProfileCompletionCalendarCard';
import ProfileDisplayNameEditorDialog from '../components/profile/ProfileDisplayNameEditorDialog';
import ProfileIdentityHeader from '../components/profile/ProfileIdentityHeader';
import ProfileRecordsCard from '../components/profile/ProfileRecordsCard';
import ProfileStatsGrid, { type ProfileStatTile } from '../components/profile/ProfileStatsGrid';
import PlanAnalyticsSection from '../features/plan/PlanAnalyticsSection';
import PlanProgressCard from '../features/plan/PlanProgressCard';
import { planCalendar } from '../features/plan/domain/planCalendar';
import { factorEffects, moodTrend, resetEffect } from '../features/plan/domain/moodAnalytics';
import { weeklyReview } from '../features/plan/domain/weeklyReview';
import AzoIdCard from '../features/room/AzoIdCard';
import DecorationCollectionCard from '../features/room/DecorationCollectionCard';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';
import { usePlanPosition } from '../hooks/usePlanPosition';
import { useProfileEditing } from '../hooks/useProfileEditing';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { formatLocalDate } from '../lib/calendar/weekCalendarDays';
import { buildProfileRecords } from '../lib/profileRecords';
import { formatProfileCount, formatProfileMonth } from '../lib/profileStatsFormat';
import { daysWithAzo } from '../lib/daysWithAzo';
import { useRecentMoodCheckInsQuery } from '../queries/mood/useRecentMoodCheckInsQuery';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { useRoomInventoryQuery } from '../queries/room/useRoomInventoryQuery';
import { useRoomsQuery } from '../queries/room/useRoomsQuery';
import { useDailyActivityRangeQuery } from '../queries/tracking/useDailyActivityRangeQuery';
import { useWalletQuery } from '../queries/wallet/useWalletQuery';
import { trackProfileAction } from '../services/analytics/tracking';
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
  const coins = useWalletQuery(userId).data;
  const rooms = useRoomsQuery(userId).data;
  const planPosition = usePlanPosition(userId);
  const ownedObjects = useRoomInventoryQuery(userId).data?.objects;
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
  const createdAt = profileSummary?.profile?.createdAt ?? null;
  const joinedLocalDate = createdAt == null ? null : formatLocalDate(new Date(createdAt));
  const displayName = profileSummary?.profile?.displayName ?? null;
  const stats: ProfileStatTile[] = [
    {
      label: 'Day streak',
      value: formatProfileCount(profileSummary?.currentStreak ?? 0),
      icon: 'streakFilled',
    },
    {
      label: 'Sessions',
      value: formatProfileCount(profileSummary?.totalSessions ?? 0),
      icon: 'lotus',
    },
    {
      label: 'Active days',
      value: formatProfileCount(profileSummary?.activeDays ?? 0),
      icon: 'calendar-check-outline',
    },
    { label: 'Coins', value: coins == null ? '—' : formatProfileCount(coins), icon: 'coin' },
  ];
  const records = buildProfileRecords({
    longestStreak: profileSummary?.longestStreak ?? 0,
    rooms: rooms ?? [],
  });
  const planTotalDays = useMemo(
    () =>
      planPosition == null
        ? null
        : planCalendar(planPosition.planId, planPosition.daysDone, planPosition.finishedToday)?.totalDays ?? null,
    [planPosition],
  );
  const openHotel = () => navigation.navigate('Hotel');
  const openHistory = () => navigation.navigate('History');
  const trend = useMemo(
    () => moodTrend(moodCheckInsQuery.data ?? [], todayLocalDate, TREND_DAYS),
    [moodCheckInsQuery.data, todayLocalDate],
  );

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: contentInset, paddingBottom: tabBarHeight + spacing.xl }}
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
                <TaskIllustration name="settings" size={28} />
              </GlassIconButton>
            }
          />
        </ScreenContent>

        <ScreenContent width="grouped" style={styles.column}>
          <ProfileIdentityHeader
            displayName={displayName ?? '—'}
            avatarUrl={profileSummary?.profile?.avatarUrl}
            joinedLabel={joinedLocalDate == null ? undefined : `Joined ${formatProfileMonth(joinedLocalDate)}`}
            isUploading={profileEditing.isUploading}
            onChangePhoto={profileEditing.changePhoto}
            onEditDisplayName={profileEditing.editDisplayName}
          />

          <AzoIdCard
            movedInLocalDate={joinedLocalDate}
            humanName={displayName}
            daysTogether={createdAt == null ? null : daysWithAzo(createdAt, todayLocalDate)}
          />

          {planPosition == null || planTotalDays == null ? null : (
            <View style={styles.section}>
              <SectionHeader title="Your plan" />
              <PlanProgressCard
                planName={planPosition.planName}
                phaseName={planPosition.phase.name}
                week={planPosition.week}
                totalWeeks={planPosition.totalWeeks}
                daysDone={planPosition.daysDone}
                totalDays={planTotalDays}
                isFinished={planPosition.isFinished}
              />
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader title="Overview" />
            <ProfileStatsGrid stats={stats} />
            <ProfileRecordsCard records={records} />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Azo's collection" actionLabel="See all" onAction={openHotel} />
            <DecorationCollectionCard owned={ownedObjects ?? []} onOpen={openHotel} />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Consistency" actionLabel="See all" onAction={openHistory} />
            <ProfileCompletionCalendarCard
              completedDays={profileSummary?.completedDays ?? []}
              moodEntries={moodCheckInsQuery.data ?? []}
              onSelectDay={(date) => navigation.navigate('History', { date })}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader icon="stat-health-spark" title="Insights" />
            <PlanAnalyticsSection
              review={review}
              daysAnswered={moodCheckInsQuery.data?.length ?? 0}
              trend={trend}
              reset={reset}
              factors={factors}
            />
          </View>
        </ScreenContent>
      </Animated.ScrollView>

      <CollapsingTitleBar title="Profile" scrollY={scrollY} />

      <ProfileDisplayNameEditorDialog
        visible={profileEditing.editingDisplayName}
        displayName={displayName ?? '—'}
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
  column: {
    gap: spacing.xl,
    paddingTop: spacing.xl,
    paddingHorizontal: padding.screen.horizontal,
  },
  section: {
    gap: spacing.md,
  },
});
