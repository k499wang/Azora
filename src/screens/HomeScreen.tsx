import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing, margin } from '../theme/spacing';
import { radius } from '../theme/card';
import {
  buildDailyRows,
  buildLessonDailyRow,
  buildMoodDailyRow,
  buildProgramDailyRows,
  buildTodoStepDailyRow,
  type DailyRowContent,
} from '../components/home/TodaysDailiesSection';
import {
  LESSON_JOURNEY_ID,
  MOOD_JOURNEY_ID,
  TODO_STEP_JOURNEY_ID,
  type TodayJourneyId,
} from '../components/home/journey/todayJourneyOrder';
import { useTodayProgramDay } from '../hooks/useTodayProgramDay';
import { isPlanDayGated } from '../features/plan/domain/planDayGate';
import AzoraScoreChip from '../features/plan/AzoraScoreChip';
import { useAzoraScore } from '../features/plan/useAzoraScore';
import { useTodoStepAction } from '../features/plan/useTodoStepAction';
import RewardAnimationPreload from '../features/plan/RewardAnimationPreload';
import { useMoodCheckInQuery } from '../queries/mood/useMoodCheckInQuery';
import HomeRoom, { homeRoomTopSlack } from '../features/room/HomeRoom';
import GlassIconButton from '../components/common/GlassIconButton';
import TaskIllustration from '../components/common/icons/TaskIllustration';
import TopBarStreak from '../components/common/TopBarStreak';
import WalletCoins from '../components/common/WalletCoins';
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
import { wasDayCelebrationSeen } from '../features/room/dailyProgressSeen';
import { useRoomClaim } from '../features/room/useRoomClaim';
import {
  clearDayCompleteForHome,
  useHomeDayCompleteHandoff,
} from '../features/room/homeDayCompleteHandoff';
import { useStartDaily } from '../hooks/useStartDaily';
import { useTourScroller, useTourTarget } from '../features/tour/tourTargets';
import type { TourTargetId } from '../features/tour/tourSteps';
import { useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { getSelfCareGoalsQueryOptions } from '../queries/selfCare/useSelfCareGoalsQuery';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import type { HomeScreenProps } from '../app/navigation';
import { useAuthStore } from '../stores/authStore';
import { useDailyRewardStage } from '../features/room/useDailyRewardStage';
import { useRewardFlowReplay } from '../features/room/devRoomOverride';
import { useDailyPlanScheduleQuery } from '../queries/dailyPlan/useDailyPlanScheduleQuery';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';
import TodoListSection from '../features/selfCare/TodoListSection';
import SurveyOfferNotice from '../components/home/SurveyOfferNotice';
import { useSurveyOfferNotice } from '../hooks/useSurveyOfferNotice';
import FirstWinOfDayPresenter from '../features/selfCare/FirstWinOfDayPresenter';
import { useUserEntitlementQuery } from '../queries/subscriptions/useUserEntitlementQuery';
import { usePlanPosition } from '../hooks/usePlanPosition';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { PaywallPlacement } from '../services/paywall';

/**
 * UIKit's compact tab bar, measured rather than asked for: the tabs are native
 * (`createNativeBottomTabNavigator`), so `useBottomTabBarHeight` has no context
 * to read here. At regular width UIKit draws a sidebar instead and there is no
 * bar under the page at all.
 */
const TAB_BAR_HEIGHT = 49;

/** the glass chip on the right of Home's top row */
const HEART_ROW_BUTTON_SIZE = 46;

const TOUR_TARGETS: TourTargetId[] = [
  'dailies',
  'firstLesson',
  'roomProgress',
  'roomPiece',
  'measureHeart',
];

/**
 * Keep rows in a neutral loading state until access resolves; then unfinished
 * gated rows open the paywall instead of their activity.
 *
 * Built through the record's own keys rather than `Object.fromEntries`, which
 * widens the result to a string index signature and gives back rows whose
 * fields are all optional — the caller then has to prove again that a row it
 * was just handed is a row. The cast is `Object.keys`' own: a key comes back as
 * `string`, and the id is the thing that carries the row's identity.
 */
function withPlanAccess<Id extends string>(
  rows: Partial<Record<Id, DailyRowContent>>,
  onLockedPress: () => void,
  entitlementPending: boolean,
): Partial<Record<Id, DailyRowContent>> {
  const gated: Partial<Record<Id, DailyRowContent>> = {};

  for (const id of Object.keys(rows) as Id[]) {
    const row = rows[id];
    if (row == null) continue;
    gated[id] = planAccessRow(row, onLockedPress, entitlementPending);
  }

  return gated;
}

function planAccessRow(
  row: DailyRowContent,
  onLockedPress: () => void,
  entitlementPending: boolean,
): DailyRowContent {
  if (entitlementPending) return { ...row, locked: false, loading: true };
  return {
    ...row,
    locked: !row.completed,
    onPress: row.completed ? row.onPress : onLockedPress,
  };
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const todayLocalDate = useTodayLocalDate();
  // Today's to-dos, fetched ahead of the Routine tab so it opens with them
  // rather than on a skeleton swapped out a moment later. Fetched, not
  // watched: Home does not re-render as they change.
  useEffect(() => {
    if (userId == null) return;
    void queryClient.prefetchQuery(getSelfCareGoalsQueryOptions(userId, todayLocalDate));
  }, [queryClient, userId, todayLocalDate]);
  const profileSummary = useProfileSummaryQuery(userId).data;
  const { score, isLoading: scoreLoading } = useAzoraScore(userId);
  const dailyPlanScheduleQuery = useDailyPlanScheduleQuery(userId);
  const dailyPlanSchedule = dailyPlanScheduleQuery.data ?? null;
  const roomClaim = useRoomClaim(userId);
  const dailies = roomClaim.dailies;
  const day = roomClaim.day;
  const hasStandaloneRoomAction =
    !roomClaim.isLoading &&
    (roomClaim.progress.canClaim || roomClaim.progress.isComplete);
  const entitlementQuery = useUserEntitlementQuery(userId);
  const isPro = entitlementQuery.data?.isPro === true;
  const planPosition = usePlanPosition(userId);
  const isDayGated = isPlanDayGated(isPro, planPosition?.daysDone ?? null);
  const { start, startProgramActivity, accessAllowed } = useStartDaily('Home', dailies);
  const program = useTodayProgramDay(userId);
  const { day: programDay, isLoading: programDayLoading } = program;
  const moodQuery = useMoodCheckInQuery(user?.id ?? null, dailies.todayLocalDate);
  // Null when this backend has no check-in table, which is the one case where
  // the day does not ask for one. See `getMoodCheckIn`.
  const moodRow =
    moodQuery.data?.available === true
      ? buildMoodDailyRow({
          completed: moodQuery.data.checkIn != null,
          loading: false,
          onPress: () => navigation.navigate('MoodCheckIn'),
        })
      : null;
  // Most days have none: ten in a plan of twenty-eight to fifty-six. The unit
  // is already in the day the reward counts, so the row is read back off it
  // rather than resolved a second time here.
  const lessonUnit = dailies.units.find((unit) => unit.kind === 'lesson');
  const openLesson = () => navigation.navigate('Lesson');
  // The tour's last stop is finished on this row's play button, and runs the
  // same action a tap on it would.
  const firstLessonTarget = useTourTarget(
    'firstLesson',
    lessonUnit == null ? undefined : openLesson,
  );
  const lessonRow =
    lessonUnit == null
      ? null
      : {
          ...buildLessonDailyRow({
            title: lessonUnit.title,
            completed: lessonUnit.completed,
            loading: false,
            onPress: openLesson,
          }),
          actionTarget: firstLessonTarget,
        };
  const todoStep = useTodoStepAction(userId, program, roomClaim);
  const todoStepRow =
    todoStep.state == null
      ? null
      : buildTodoStepDailyRow({
          state: todoStep.state,
          loading: todoStep.isLoading,
          onPress: todoStep.run,
        });
  // The rows today has that own no hour. Which of them exist is decided here,
  // where they are built; their default and saved places belong to the journey.
  const untimedRows: Partial<Record<TodayJourneyId, DailyRowContent>> = {};
  if (moodRow != null) untimedRows[MOOD_JOURNEY_ID] = moodRow;
  if (lessonRow != null) untimedRows[LESSON_JOURNEY_ID] = lessonRow;
  if (todoStepRow != null) untimedRows[TODO_STEP_JOURNEY_ID] = todoStepRow;

  const homeLayout = useDashboardLayout();
  const insets = useSafeAreaInsets();
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const celebrations = useRef<HomeCelebrationHandle>(null);
  const surveyOffer = useSurveyOfferNotice();

  const { width: windowWidth } = useWindowDimensions();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [handedUnitId, setHandedUnitId] = useState<string | null>(null);
  const [progressCardHeight, setProgressCardHeight] = useState(0);
  const reward = useDailyRewardStage({
    userId: user?.id ?? null,
    claim: roomClaim,
    todayLocalDate: dailies.todayLocalDate,
  });
  const unlockVisible = sheetOpen || reward.decorating;
  const rewardVisible = unlockVisible || reward.sealing;
  const isFocused = useIsFocused();
  const pieceReady = day.allCompleted && roomClaim.progress.canClaim;
  const wasPieceReady = useRef<boolean | null>(null);

  // Completing the last to-do on Home earns the same gift as any other daily.
  // Only celebrate the transition; completed days remain available on the card.
  useEffect(() => {
    if (roomClaim.isLoading) return;
    const was = wasPieceReady.current;
    wasPieceReady.current = pieceReady;
    if (
      was === false &&
      pieceReady &&
      isFocused &&
      !wasDayCelebrationSeen(dailies.todayLocalDate, dailies.dailiesTotal)
    ) {
      setSheetOpen(true);
    }
  }, [
    dailies.dailiesTotal,
    dailies.todayLocalDate,
    isFocused,
    pieceReady,
    roomClaim.isLoading,
  ]);

  // Lessons and check-ins return here before their final write has settled.
  const dayCompleteHandoff = useHomeDayCompleteHandoff();
  useEffect(() => {
    if (dayCompleteHandoff.stage !== 'ready' || !isFocused) return;
    setHandedUnitId(dayCompleteHandoff.unitId);
    setSheetOpen(true);
  }, [dayCompleteHandoff, isFocused]);
  const projection = useMemo(() => ({ unitId: handedUnitId }), [handedUnitId]);

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
    projection,
  });
  useTrackDailyCompletion(snapshot, roomClaim);

  // DayCompleteCover hides Home until the gift covers it, or until there is
  // no gift to wait for.
  const giftWillShow = snapshot == null || snapshot.state.unlocked;
  useEffect(() => {
    if (sheetOpen && dayCompleteHandoff.stage === 'ready' && !giftWillShow) {
      clearDayCompleteForHome();
    }
  }, [dayCompleteHandoff.stage, giftWillShow, sheetOpen]);
  const handleGiftShown = useCallback(() => {
    markSeen();
    if (dayCompleteHandoff.stage === 'ready') clearDayCompleteForHome();
  }, [dayCompleteHandoff.stage, markSeen]);

  // A completed day with no decoration must not leave an empty presentation.
  useEffect(() => {
    if (sheetOpen && snapshot != null && !snapshot.state.unlocked) {
      setSheetOpen(false);
    }
  }, [sheetOpen, snapshot]);

  const giftVisible =
    (sheetOpen || reward.handingOver) &&
    snapshot?.state.unlocked === true;

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
  const roomPieceTarget = useTourTarget('roomPiece');
  const measureHeartTarget = useTourTarget('measureHeart');
  // The plan owns the day once the user has one. Everyone else — an account
  // from before plans existed, or a backend without the tables — keeps the two
  // rows they have always had.
  //
  // Nothing is drawn until it is known which of those two a user is. Deciding
  // early means someone with a plan watches the rows they had yesterday appear
  // and then be replaced, and can tap one in between.
  const dailyRows =
    dailyPlanSchedule == null || programDayLoading
      ? null
      : programDay != null
        ? buildProgramDailyRows({
            activities: programDay.activities,
            schedule: dailyPlanSchedule,
            exerciseAccessAllowed: accessAllowed,
            onPressActivity: (activity) =>
              startProgramActivity(activity.activityId, 'todays_plan_activity'),
          })
        : buildDailyRows({
            technique: dailies.guidedTechnique,
            techniqueLoading: dailies.guidedTechniqueLoading,
            handPickedTechnique: dailies.handPickedTechnique,
            handPickedTechniqueLoading: dailies.handPickedTechniqueLoading,
            schedule: dailyPlanSchedule,
            guidedExerciseCompleted: dailies.guidedCompleted,
            handPickedExerciseCompleted: dailies.handPickedCompleted,
            exerciseAccessAllowed: accessAllowed,
            onPressGuidedExercise: () => start('guided'),
            onPressHandPickedExercise: () => start('handPicked'),
          });

  // Lock day 3+ content for free users
  const openProPaywall = useCallback(() => {
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.PlanWeekProGate,
      sourceScreen: 'Home',
      sourceAction: 'locked_week_tap',
    });
  }, [navigation]);

  const gatedDailyRows =
    (isDayGated || entitlementQuery.isPending) && dailyRows != null
      ? withPlanAccess(dailyRows, openProPaywall, entitlementQuery.isPending)
      : dailyRows;

  const gatedUntimedRows = isDayGated || entitlementQuery.isPending
    ? withPlanAccess(untimedRows, openProPaywall, entitlementQuery.isPending)
    : untimedRows;

  return (
    <View style={styles.screen}>
      <RewardAnimationPreload pose="proud" enabled={todoStep.state === 'claimable'} />
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
          {/* The slot keeps the row's trailing chips pushed right; the target
              itself must hug the button, because the tour measures this View
              to draw the spotlight around it. */}
          <View style={styles.heartSlot}>
            <View {...measureHeartTarget}>
              <GlassIconButton
                accessibilityLabel="Open heart statistics"
                size={HEART_ROW_BUTTON_SIZE}
                variant="regular"
                onPress={() => navigation.navigate('Heart')}
              >
                <TaskIllustration name="heart" size={30} />
              </GlassIconButton>
            </View>
          </View>
          <AzoraScoreChip score={score} isLoading={scoreLoading} size="compact" />
          <WalletCoins userId={userId} size="compact" />
          <TopBarStreak
            size="compact"
            streakDays={profileSummary?.currentStreak ?? 0}
            onPress={() => navigation.navigate('Insights')}
          />
        </View>

        <View
          {...roomPieceTarget}
          style={[styles.roomBlock, { marginTop: styles.roomBlock.marginTop - homeRoomTopSlack(windowWidth) }]}
          // The reward draws its own copy over the top of this one, on a sheet
          // that covers the whole screen. This one stays mounted underneath so
          // that when the sheet leaves there is already a room here, rather
          // than an empty block that fills in a frame later.
          pointerEvents={flowVisible ? 'none' : 'auto'}
        >
          <HomeRoom
            room={roomClaim.room}
            progress={roomClaim.progress}
            active={
              isFocused && !rewardVisible && dayCompleteHandoff.stage === 'idle'
            }
            autoGreet
            loading={roomClaim.isLoading}
            world
          />
        </View>

        {/* The progress card belongs to the dailies it tracks, so the whole
            group stays together and centred directly below the room. */}
        <View
          style={[
            styles.dailiesGroup,
            hasStandaloneRoomAction && styles.dailiesGroupWithAction,
            { paddingHorizontal: homeLayout.contentInset },
          ]}
        >
          <View
            onLayout={(e) => setProgressCardHeight(e.nativeEvent.layout.height)}
            style={{ marginTop: -spacing.lg - progressCardHeight / 2 }}
          >
            <RoomProgressCard
              progress={roomClaim.progress}
              day={day}
              isLoading={roomClaim.isLoading}
              onClaim={() => reward.open()}
              target={roomProgressTarget}
            />
          </View>
          <View style={styles.todayList} {...dailiesTarget}>
            <TodoListSection
              dailyRows={gatedDailyRows}
              untimedRows={gatedUntimedRows}
              schedule={dailyPlanSchedule}
              scheduleError={dailyPlanScheduleQuery.isError}
              onRetrySchedule={() => dailyPlanScheduleQuery.refetch()}
              userId={user?.id ?? null}
              scrollRef={scroller}
            />
          </View>
        </View>
      </ScrollView>

      <DailyRewardSurface visible={rewardVisible}>
        {giftVisible && snapshot != null ? (
          <DailyCompleteSheet
            hosted
            visible
            title="New decoration unlocked!"
            subtitle="Choose something new for your room"
            state={snapshot.state}
            barFrom={snapshot.barFrom}
            onShow={handleGiftShown}
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

      {/* Keep the first-win presentation behind an open room reward. */}
      <FirstWinOfDayPresenter
        active={
          isFocused && !rewardVisible && dayCompleteHandoff.stage === 'idle'
        }
      />
      <HomeCelebrationLayer
        active={
          isFocused && !rewardVisible && dayCompleteHandoff.stage === 'idle'
        }
        ref={celebrations}
        tabBarHeight={tabBarHeight}
        notice={
          surveyOffer.visible ? (
            <SurveyOfferNotice
              onPress={surveyOffer.open}
              onDismiss={surveyOffer.dismiss}
            />
          ) : null
        }
        onNoticePreempted={surveyOffer.preempt}
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
    flexGrow: 1,
  },
  topRow: {
    // Above the room's world, which reaches up behind it from the next block.
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  heartSlot: {
    flex: 1,
    alignItems: 'flex-start',
  },
  roomBlock: {
    marginTop: spacing['2xl'],
  },
  // A canvas sheet over the room's floor, so the cards sit on the page rather
  // than on the floor pattern, and the floor ends at its rounded top edge.
  dailiesGroup: {
    flexGrow: 1,
    marginTop: margin.itemGap + spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing['7xl'] + spacing.xl,
    gap: spacing.md,
    borderTopLeftRadius: radius.hero,
    borderTopRightRadius: radius.hero,
    borderCurve: 'continuous',
    backgroundColor: colors.background.canvas,
  },
  dailiesGroupWithAction: {
    gap: spacing.sm,
  },
  todayList: {
    // The exercises and the to-dos are one day, so they sit closer than two
    // separate sections would. The to-do group label carries its own space
    // above it, and stacking a full gap on top of that read as a gulf between
    // them rather than a break.
    gap: spacing.sm,
  },
});
