import { ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, margin } from '../theme/spacing';
import AppTopBar from '../components/common/AppTopBar';
import ExtraPracticeSection from '../components/home/ExtraPracticeSection';
import TodaysDailiesSection from '../components/home/TodaysDailiesSection';
import HomeRoom from '../features/room/HomeRoom';
import HotelButton from '../features/room/HotelButton';
import RoomProgressCard from '../features/room/RoomProgressCard';
import { useRoomClaim } from '../features/room/useRoomClaim';
import { useStartDaily } from '../hooks/useStartDaily';
import { useTourScroller, useTourTarget } from '../features/tour/tourTargets';
import type { TourTargetId } from '../features/tour/tourSteps';
import type { HomeScreenProps } from '../app/navigation';
import { useAuthStore } from '../stores/authStore';
import { useDailyPlanScheduleQuery } from '../queries/dailyPlan/useDailyPlanScheduleQuery';
import { DEFAULT_DAILY_PLAN_SCHEDULE } from '../services/dailyPlan/types';
import { useDashboardLayout } from '../hooks/useDashboardLayout';

const TOUR_TARGETS: TourTargetId[] = ['dailies', 'extraPractice', 'seeAll'];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const user = useAuthStore((state) => state.user);
  const dailyPlanScheduleQuery = useDailyPlanScheduleQuery(user?.id ?? null);
  const dailyPlanSchedule =
    dailyPlanScheduleQuery.data ?? DEFAULT_DAILY_PLAN_SCHEDULE;
  const roomClaim = useRoomClaim(user?.id ?? null);
  const dailies = roomClaim.dailies;
  const { start, accessAllowed, exerciseAccess } = useStartDaily('Home', dailies);

  const homeLayout = useDashboardLayout();

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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <AppTopBar
          showNotifications
          showAvatar={false}
          rightSlot={<HotelButton floors={roomClaim.room?.floor ?? 1} />}
        />

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
          <RoomProgressCard
            progress={roomClaim.progress}
            dailies={dailies}
            isLoading={roomClaim.isLoading}
          />
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
            />
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
  // Tighter than the standard item gap: the room is what the screen opens on,
  // so it sits up under the bar rather than reading as the first item in a list.
  roomBlock: {
    marginTop: spacing.md,
  },
  dailiesGroup: {
    marginTop: margin.itemGap,
    gap: spacing.md,
  },
  extraPracticeSection: {
    marginTop: margin.sectionGap,
  },
});
