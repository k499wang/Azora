import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing, margin } from '../theme/spacing';
import ExtraPracticeSection from '../components/home/ExtraPracticeSection';
import TodaysDailiesSection from '../components/home/TodaysDailiesSection';
import HomeRoom from '../features/room/HomeRoom';
import HotelButton from '../features/room/HotelButton';
import NotificationsSettingsSheet from '../features/notifications/NotificationsSettingsSheet';
import GlassIconButton from '../components/common/GlassIconButton';
import Icon from '../components/common/icons/Icon';
import TopBarStreak from '../components/common/TopBarStreak';
import HomeCelebrationLayer, {
  type HomeCelebrationHandle,
} from '../components/home/HomeCelebrationLayer';
import RoomProgressCard from '../features/room/RoomProgressCard';
import DailyCompleteSheet from '../features/room/DailyCompleteSheet';
import {
  isDailyCompleteRewardReady,
  useDailyCompleteSnapshot,
} from '../features/room/useDailyCompleteSnapshot';
import { useTrackDailyCompletion } from '../features/room/useTrackDailyCompletion';
import { useRoomClaim } from '../features/room/useRoomClaim';
import { useStartDaily } from '../hooks/useStartDaily';
import { useTourScroller, useTourTarget } from '../features/tour/tourTargets';
import type { TourTargetId } from '../features/tour/tourSteps';
import { useIsFocused } from '@react-navigation/native';
import type { HomeScreenProps } from '../app/navigation';
import { useAuthStore } from '../stores/authStore';
import { useDailyPlanScheduleQuery } from '../queries/dailyPlan/useDailyPlanScheduleQuery';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { DEFAULT_DAILY_PLAN_SCHEDULE } from '../services/dailyPlan/types';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';
import TodoListSection from '../features/selfCare/TodoListSection';

/**
 * UIKit's compact tab bar, measured rather than asked for: the tabs are native
 * (`createNativeBottomTabNavigator`), so `useBottomTabBarHeight` has no context
 * to read here. At regular width UIKit draws a sidebar instead and there is no
 * bar under the page at all.
 */
const TAB_BAR_HEIGHT = 49;

/** the glass chips on the right of Home's top row */
const HOTEL_ROW_BUTTON_SIZE = 46;

/** Nothing is mid-flight when the day is finished by a to-do on this screen. */
const NO_PROJECTION = {};

const TOUR_TARGETS: TourTargetId[] = [
  'dailies',
  'todos',
  'extraPractice',
  'seeAll',
  'hotel',
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const user = useAuthStore((state) => state.user);
  const dailyPlanScheduleQuery = useDailyPlanScheduleQuery(user?.id ?? null);
  const profileSummary = useProfileSummaryQuery(user?.id ?? null).data;
  const dailyPlanSchedule =
    dailyPlanScheduleQuery.data ?? DEFAULT_DAILY_PLAN_SCHEDULE;
  const roomClaim = useRoomClaim(user?.id ?? null);
  const dailies = roomClaim.dailies;
  const day = roomClaim.day;
  /**
   * Nothing left in the day, on either list — the live answer, not the latched
   * one: a to-do added after the decoration was earned is still a to-do, and
   * folding the list away would hide it.
   */
  const dayDone = day.liveCompleted;
  const { start, accessAllowed, exerciseAccess } = useStartDaily('Home', dailies);

  const homeLayout = useDashboardLayout();
  const insets = useSafeAreaInsets();
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const celebrations = useRef<HomeCelebrationHandle>(null);

  const [notificationsVisible, setNotificationsVisible] = useState(false);

  // The last thing in a day can be a to-do ticked off here rather than a
  // session, so the unlock celebration has to be able to fire from Home too.
  //
  // It plays on the transition only: a day that was already complete when Home
  // opened has had its moment, and the first loaded read just records where
  // things stood. The tick is optimistic, so this rides the same frame the row
  // checks on rather than waiting for the write to come back — the celebration
  // belongs to the tap.
  //
  // Focus matters: a session finishing on the results screen crosses the same
  // line while Home is still mounted underneath, and that screen has its own
  // sheet. Recording the transition without firing is what keeps this one from
  // opening on top of it.
  const [unlockVisible, setUnlockVisible] = useState(false);
  const isFocused = useIsFocused();
  const pieceReady = day.allCompleted && roomClaim.progress.canClaim;
  const wasPieceReady = useRef<boolean | null>(null);

  useEffect(() => {
    if (roomClaim.isLoading) return;

    const was = wasPieceReady.current;
    wasPieceReady.current = pieceReady;
    if (was === false && pieceReady && isFocused) setUnlockVisible(true);
  }, [isFocused, pieceReady, roomClaim.isLoading]);

  const { snapshot, markSeen } = useDailyCompleteSnapshot({
    active: unlockVisible,
    claim: roomClaim,
    projection: NO_PROJECTION,
  });
  useTrackDailyCompletion(snapshot, roomClaim);

  const handleUnlockDismiss = useCallback(() => setUnlockVisible(false), []);
  const handleChoosePiece = useCallback(() => {
    setUnlockVisible(false);
    navigation.navigate('RoomDecorate');
  }, [navigation]);

  const tourScroll = useTourScroller(TOUR_TARGETS);
  const dailiesTarget = useTourTarget('dailies');
  const todosTarget = useTourTarget('todos');
  const extraPracticeTarget = useTourTarget('extraPractice');
  const hotelTarget = useTourTarget('hotel');

  // The recently-logged list and its analytics now live on the Heart tab
  // (see RecentlyLoggedSection — it uses useIsFocused to gate the view event).

  return (
    <View style={styles.screen}>
      <ScrollView
        {...tourScroll}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top },
        ]}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <View style={styles.topRow}>
          <TopBarStreak
            streakDays={profileSummary?.currentStreak ?? 0}
            onPress={() => navigation.navigate('Profile')}
          />
          <View style={styles.topRowActions}>
            <GlassIconButton
              accessibilityLabel="Open notification settings"
              size={HOTEL_ROW_BUTTON_SIZE}
              variant="regular"
              onPress={() => setNotificationsVisible(true)}
            >
              <Icon name="bell" size={26} color={colors.playful.sky.base} />
            </GlassIconButton>
            <View {...hotelTarget}>
              <HotelButton floors={roomClaim.room?.floor ?? 1} />
            </View>
          </View>
        </View>

        <View style={styles.roomBlock}>
          <HomeRoom room={roomClaim.room} progress={roomClaim.progress} />
        </View>

        {/* The progress card belongs to the dailies it tracks, so the whole
            group stays together and centred directly below the room. */}
        <View
          style={[
            styles.dailiesGroup,
            { paddingHorizontal: homeLayout.contentInset },
          ]}
        >
          <View>
            <RoomProgressCard
              progress={roomClaim.progress}
              day={day}
              isLoading={roomClaim.isLoading}
            />
          </View>
          <View style={styles.todayList}>
            <View {...dailiesTarget}>
              <TodaysDailiesSection
                technique={dailies.guidedTechnique}
                techniqueLoading={dailies.guidedTechniqueLoading}
                sessionTime={dailyPlanSchedule.actions.session}
                handPickedTechnique={dailies.handPickedTechnique}
                handPickedTechniqueLoading={dailies.handPickedTechniqueLoading}
                handPickedTime={dailyPlanSchedule.actions.handPicked}
                breathHoldTime={dailyPlanSchedule.actions.checkIn}
                guidedExerciseCompleted={dailies.guidedCompleted}
                handPickedExerciseCompleted={dailies.handPickedCompleted}
                breathHoldCompleted={dailies.breathHoldCompleted}
                exerciseAccessAllowed={accessAllowed}
                onPressGuidedExercise={() => start('guided')}
                onPressHandPickedExercise={() => start('handPicked')}
                onPressBreathHold={() => start('breathHold')}
                onPressHistory={() => navigation.navigate('History')}
                dayDone={dayDone}
              />
            </View>
            <View {...todosTarget}>
              <TodoListSection
                userId={user?.id ?? null}
                dayDone={dayDone}
                onCelebrate={() => celebrations.current?.burst()}
                onCompleted={(goalTitle) =>
                  celebrations.current?.confirm(goalTitle)
                }
              />
            </View>
          </View>
        </View>

        {/* The shelf stays horizontally scrollable at every width and runs to
            the column edge, so the row a tablet cuts off is cut off on the same
            margin the dailies above it sit on. */}
        <View style={styles.extraPracticeSection} {...extraPracticeTarget}>
          <ExtraPracticeSection
            recommendedTechniqueId={dailies.guidedTechnique?.id ?? null}
            excludedTechniqueIds={[
              dailies.guidedTechnique?.id,
              dailies.handPickedTechnique?.id,
            ]}
            exerciseAccess={exerciseAccess}
            contentMaxWidth={homeLayout.contentMaxWidth}
            onSeeAll={() => navigation.navigate('Explore')}
          />
        </View>
      </ScrollView>

      {unlockVisible && snapshot != null ? (
        <DailyCompleteSheet
          visible
          title="Nice work!"
          subtitle="Everything on today's list is done"
          state={snapshot.state}
          barFrom={snapshot.barFrom}
          rewardReady={isDailyCompleteRewardReady(
            snapshot.state,
            roomClaim.progress.canClaim,
          )}
          onShow={markSeen}
          onChoosePiece={handleChoosePiece}
          onDismiss={handleUnlockDismiss}
        />
      ) : null}

      <HomeCelebrationLayer ref={celebrations} tabBarHeight={tabBarHeight} />

      <NotificationsSettingsSheet
        visible={notificationsVisible}
        userId={user?.id ?? null}
        onClose={() => setNotificationsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: spacing['7xl'] + spacing.xl,
  },
  // Everything below the chips rides up under them: the top row is chrome, so
  // the room starts as close to the status bar as the chips allow.
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  topRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roomBlock: {
    marginTop: -spacing.sm,
  },
  dailiesGroup: {
    marginTop: margin.itemGap,
    gap: spacing.md,
  },
  todayList: {
    // The exercises and the to-dos are one day, so they sit closer than two
    // separate sections would. The to-do group label carries its own space
    // above it, and stacking a full gap on top of that read as a gulf between
    // them rather than a break.
    gap: spacing.sm,
  },
  extraPracticeSection: {
    marginTop: margin.sectionGap,
  },
});
