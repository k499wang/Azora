import { useState } from 'react';
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
import RoomProgressCard from '../features/room/RoomProgressCard';
import { useRoomClaim } from '../features/room/useRoomClaim';
import { useStartDaily } from '../hooks/useStartDaily';
import { useTourScroller, useTourTarget } from '../features/tour/tourTargets';
import type { TourTargetId } from '../features/tour/tourSteps';
import type { HomeScreenProps } from '../app/navigation';
import { useAuthStore } from '../stores/authStore';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useSelfCareGoalsQuery } from '../queries/selfCare/useSelfCareGoalsQuery';
import { useDailyPlanScheduleQuery } from '../queries/dailyPlan/useDailyPlanScheduleQuery';
import { DEFAULT_DAILY_PLAN_SCHEDULE } from '../services/dailyPlan/types';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import TodoListSection from '../features/selfCare/TodoListSection';

/** the glass chips either side of Home's top row */
const HOTEL_ROW_BUTTON_SIZE = 46;

const TOUR_TARGETS: TourTargetId[] = ['dailies', 'extraPractice', 'seeAll'];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const user = useAuthStore((state) => state.user);
  const todayLocalDate = useTodayLocalDate();
  const dailyPlanScheduleQuery = useDailyPlanScheduleQuery(user?.id ?? null);
  const dailyPlanSchedule =
    dailyPlanScheduleQuery.data ?? DEFAULT_DAILY_PLAN_SCHEDULE;
  const roomClaim = useRoomClaim(user?.id ?? null);
  const dailies = roomClaim.dailies;
  /**
   * Nothing left in the day, on either list. Home is the only place that can
   * see both, so it decides — and when it is true both sections fold away and
   * the day is one card.
   */
  const selfCareGoals = useSelfCareGoalsQuery(user?.id ?? null, todayLocalDate);
  const dayDone =
    dailies.guidedCompleted &&
    dailies.handPickedCompleted &&
    dailies.breathHoldCompleted &&
    selfCareGoals.isSuccess &&
    selfCareGoals.data.every((goal) => goal.completedToday);
  const { start, accessAllowed, exerciseAccess } = useStartDaily('Home', dailies);

  const homeLayout = useDashboardLayout();
  const insets = useSafeAreaInsets();

  const [notificationsVisible, setNotificationsVisible] = useState(false);

  const tourScroll = useTourScroller(TOUR_TARGETS);
  const dailiesTarget = useTourTarget('dailies');
  const extraPracticeTarget = useTourTarget('extraPractice');

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
        <View style={styles.hotelRow}>
          <GlassIconButton
            accessibilityLabel="Open notification settings"
            size={HOTEL_ROW_BUTTON_SIZE}
            variant="regular"
            onPress={() => setNotificationsVisible(true)}
          >
            <Icon name="bell" size={26} color={colors.playful.sky.base} />
          </GlassIconButton>
          <HotelButton floors={roomClaim.room?.floor ?? 1} />
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
              dailies={dailies}
              isLoading={roomClaim.isLoading}
            />
          </View>
          <View {...dailiesTarget}>
            <View style={styles.todayList}>
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
              <TodoListSection userId={user?.id ?? null} dayDone={dayDone} />
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
  hotelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  roomBlock: {
    marginTop: -spacing.sm,
  },
  dailiesGroup: {
    marginTop: margin.itemGap,
    gap: spacing.md,
  },
  todayList: {
    gap: spacing.md,
  },
  extraPracticeSection: {
    marginTop: margin.sectionGap,
  },
});
