import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing, margin } from '../theme/spacing';
import { buildDailyRows } from '../components/home/TodaysDailiesSection';
import HomeRoom from '../features/room/HomeRoom';
import GlassIconButton from '../components/common/GlassIconButton';
import Icon from '../components/common/icons/Icon';
import TopBarStreak from '../components/common/TopBarStreak';
import HomeCelebrationLayer, {
  type HomeCelebrationHandle,
} from '../components/home/HomeCelebrationLayer';
import RoomProgressCard from '../features/room/RoomProgressCard';
import DailyCompleteSheet from '../features/room/DailyCompleteSheet';
import DailyRewardSurface from '../features/room/DailyRewardSurface';
import RoomSealFlow from '../features/room/RoomSealFlow';
import DailyRewardFlow from '../features/room/DailyRewardFlow';
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
import { useDailyRewardStage } from '../features/room/useDailyRewardStage';
import { useRewardFlowReplay } from '../features/room/devRoomOverride';
import { useDailyPlanScheduleQuery } from '../queries/dailyPlan/useDailyPlanScheduleQuery';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
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

/** the glass chip on the right of Home's top row */
const HEART_ROW_BUTTON_SIZE = 46;

/** Nothing is mid-flight when the day is finished by a to-do on this screen. */
const NO_PROJECTION = {};

const TOUR_TARGETS: TourTargetId[] = [
  'dailies',
  'roomProgress',
  'measureHeart',
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const user = useAuthStore((state) => state.user);
  const dailyPlanScheduleQuery = useDailyPlanScheduleQuery(user?.id ?? null);
  const profileSummary = useProfileSummaryQuery(user?.id ?? null).data;
  const dailyPlanSchedule = dailyPlanScheduleQuery.data ?? null;
  const roomClaim = useRoomClaim(user?.id ?? null);
  const dailies = roomClaim.dailies;
  const day = roomClaim.day;
  /**
   * Nothing left in the day, on either list — the live answer, not the latched
   * one: a to-do added after the decoration was earned is still a to-do, and
   * folding the list away would hide it.
   */
  const dayDone = day.liveCompleted;
  const { start, accessAllowed } = useStartDaily('Home', dailies);

  const homeLayout = useDashboardLayout();
  const insets = useSafeAreaInsets();
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const celebrations = useRef<HomeCelebrationHandle>(null);

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
  /**
   * Two beats, never overlapping: the sheet carries the flame and the numbers,
   * then the room takes the screen to be decorated. They cannot share it —
   * white celebration text over a room is legible in some shells and not
   * others, and the room's colours change every time a piece is placed.
   */
  const [sheetOpen, setSheetOpen] = useState(false);
  const reward = useDailyRewardStage({
    userId: user?.id ?? null,
    claim: roomClaim,
    todayLocalDate: dailies.todayLocalDate,
  });
  const unlockVisible = sheetOpen || reward.decorating;
  /** anything the reward draws on its surface, in any phase */
  const rewardVisible = unlockVisible || reward.sealing;
  const isFocused = useIsFocused();
  const pieceReady = day.allCompleted && roomClaim.progress.canClaim;
  const wasPieceReady = useRef<boolean | null>(null);

  useEffect(() => {
    if (roomClaim.isLoading) return;

    const was = wasPieceReady.current;
    wasPieceReady.current = pieceReady;
    if (was === false && pieceReady && isFocused) setSheetOpen(true);
  }, [isFocused, pieceReady, roomClaim.isLoading]);

  const replay = useRewardFlowReplay();
  const replayed = useRef(0);
  useEffect(() => {
    // Once per request. Without this the lab's ask would be honoured again on
    // the next render that touched it, reopening what was just dismissed.
    if (replay.count === replayed.current) return;
    replayed.current = replay.count;

    if (replay.mode === 'seal') {
      reward.startSeal();
      return;
    }
    setSheetOpen(true);
  }, [replay, reward]);

  const { snapshot, markSeen } = useDailyCompleteSnapshot({
    active: unlockVisible,
    claim: roomClaim,
    projection: NO_PROJECTION,
  });
  useTrackDailyCompletion(snapshot, roomClaim);

  const flowVisible = reward.decorating;

  const handleSheetDismiss = useCallback(() => setSheetOpen(false), []);
  const handleChoosePiece = useCallback(() => {
    setSheetOpen(false);
    reward.open({ handOver: true });
  }, [reward]);



  /**
   * One ref for this scroll view, not two. The tour scrolls a stop into place
   * through it, and both lists hand it to their drag so a row held on either
   * makes this wait rather than scroll — a drag and a scroll are the same
   * vertical finger, and letting both run moves the list under the row being
   * placed. A second `ref` here would win over this one and leave the tour
   * unable to scroll at all.
   */
  const tourScroll = useTourScroller(TOUR_TARGETS);
  const scroller = tourScroll.ref;
  const dailiesTarget = useTourTarget('dailies');
  const roomProgressTarget = useTourTarget('roomProgress');
  const measureHeartTarget = useTourTarget('measureHeart');
  const dailyRows = dailyPlanSchedule == null ? null : buildDailyRows({
    technique: dailies.guidedTechnique,
    techniqueLoading: dailies.guidedTechniqueLoading,
    handPickedTechnique: dailies.handPickedTechnique,
    handPickedTechniqueLoading: dailies.handPickedTechniqueLoading,
    schedule: dailyPlanSchedule,
    guidedExerciseCompleted: dailies.guidedCompleted,
    handPickedExerciseCompleted: dailies.handPickedCompleted,
    breathHoldCompleted: dailies.breathHoldCompleted,
    exerciseAccessAllowed: accessAllowed,
    onPressGuidedExercise: () => start('guided'),
    onPressHandPickedExercise: () => start('handPicked'),
    onPressBreathHold: () => start('breathHold'),
  });

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
            <View {...measureHeartTarget}>
              <GlassIconButton
                accessibilityLabel="Open heart statistics"
                size={HEART_ROW_BUTTON_SIZE}
                variant="regular"
                onPress={() => navigation.navigate('Heart')}
              >
                <Icon name="heart" size={26} color={colors.playful.sky.base} />
              </GlassIconButton>
            </View>
          </View>
        </View>

        <View
          style={styles.roomBlock}
          // The reward draws its own copy over the top of this one, on a sheet
          // that covers the whole screen. This one stays mounted underneath so
          // that when the sheet leaves there is already a room here, rather
          // than an empty block that fills in a frame later.
          pointerEvents={flowVisible ? 'none' : 'auto'}
        >
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
          <View {...roomProgressTarget}>
            <RoomProgressCard
              progress={roomClaim.progress}
              day={day}
              isLoading={roomClaim.isLoading}
              onClaim={() => reward.open()}
            />
          </View>
          <View style={styles.todayList} {...dailiesTarget}>
            <TodoListSection
              dailyRows={dailyRows}
              schedule={dailyPlanSchedule}
              scheduleError={dailyPlanScheduleQuery.isError}
              onRetrySchedule={() => dailyPlanScheduleQuery.refetch()}
              onPressHistory={() => navigation.navigate('History')}
              userId={user?.id ?? null}
              dayDone={dayDone}
              onCelebrate={() => celebrations.current?.burst()}
              onCompleted={(goalTitle) =>
                celebrations.current?.confirm(goalTitle)
              }
              scrollRef={scroller}
            />
          </View>
        </View>
      </ScrollView>

      {/* One presentation from the flame through to the piece landing. The
          celebration lingers behind the stage's field as it closes over it,
          which is a cross-fade rather than one modal replacing another. */}
      <DailyRewardSurface visible={rewardVisible}>
        {(sheetOpen || reward.handingOver) && snapshot != null ? (
          <DailyCompleteSheet
            hosted
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
            onDismiss={handleSheetDismiss}
          />
        ) : null}

        {flowVisible ? (
          <DailyRewardFlow
            hosted
            room={roomClaim.room}
            progress={roomClaim.progress}
            rewardReady={isDailyCompleteRewardReady(
              snapshot?.state ?? { unlocked: true },
              roomClaim.progress.canClaim,
            )}
            onSealFrom={reward.setSealFrom}
            onPlace={reward.place}
            onDismiss={reward.close}
          />
        ) : null}

        {reward.sealing ? (
          <RoomSealFlow
            userId={user?.id ?? null}
            room={roomClaim.room}
            from={reward.sealFrom}
            onDone={reward.endSeal}
          />
        ) : null}
      </DailyRewardSurface>

      <HomeCelebrationLayer ref={celebrations} tabBarHeight={tabBarHeight} />
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
});
