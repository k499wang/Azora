import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RoutineBrowserScreenProps } from '../app/navigation';
import Animated from 'react-native-reanimated';
import CollapsingTitleBar, { CollapsingBackTitle, useCollapsingTitle } from '../components/common/CollapsingTitleBar';
import ScreenContent from '../components/common/ScreenContent';
import { Text } from '../components/common/Text';
import ExploreShelf from '../components/explore/ExploreShelf';
import RoutineShelfCard from '../components/explore/RoutineShelfCard';
import { ROUTINE_SHELVES, routineShelfTemplates } from '../data/routineShelves';
import RoutineCategoryCard, { MyRoutineCard } from '../features/selfCare/RoutineCategoryCard';
import { GOAL_SUGGESTION_CATEGORIES } from '../features/selfCare/goalSuggestions';
import { useIsRoutineAdded } from '../features/selfCare/useIsRoutineAdded';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useActiveSelfCareGoalsQuery } from '../queries/selfCare/useActiveSelfCareGoalsQuery';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const SHELF_CARD_WIDTH = 188;

/** Every routine, sorted by when and why someone would want it. */
export default function RoutineBrowserScreen({ navigation }: RoutineBrowserScreenProps) {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const habitCount = useActiveSelfCareGoalsQuery(userId, todayLocalDate).data?.length ?? null;
  const isAdded = useIsRoutineAdded();
  const { scrollY, onScroll } = useCollapsingTitle();

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <CollapsingBackTitle title="Routines" />
          <ScreenContent width="grouped" style={styles.inset}>
          <MyRoutineCard habitCount={habitCount} onPress={() => navigation.navigate('MyRoutine')} />
          </ScreenContent>
        </View>
        {ROUTINE_SHELVES.map((shelf) => (
          <ExploreShelf
            key={shelf.id}
            title={shelf.label}
            onSeeAll={() => navigation.navigate('RoutineShelf', { shelfId: shelf.id })}
          >
            {routineShelfTemplates(shelf).map((routine) => (
              <View key={routine.id} style={styles.shelfCard}>
                <RoutineShelfCard
                  routine={routine}
                  added={isAdded(routine)}
                  onPress={() => navigation.navigate('RoutineLibraryDetail', { libraryId: routine.id })}
                />
              </View>
            ))}
          </ExploreShelf>
        ))}
        <ScreenContent width="grouped" style={[styles.inset, styles.habits]}>
          <Text style={styles.title}>Daily habits</Text>
          {GOAL_SUGGESTION_CATEGORIES.map((category) => (
            <RoutineCategoryCard
              key={category.id}
              category={category}
              variant="row"
              onPress={() => navigation.navigate('RoutineCategory', { categoryId: category.id })}
            />
          ))}
        </ScreenContent>
      </Animated.ScrollView>
      <CollapsingTitleBar title="Routines" scrollY={scrollY} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    gap: spacing['2xl'],
  },
  inset: {
    paddingHorizontal: padding.screen.horizontal,
  },
  shelfCard: {
    width: SHELF_CARD_WIDTH,
  },
  habits: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    paddingBottom: spacing.sm,
  },
});
