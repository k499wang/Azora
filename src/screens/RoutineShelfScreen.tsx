import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RoutineShelfScreenProps } from '../app/navigation';
import Animated from 'react-native-reanimated';
import CollapsingTitleBar, { CollapsingBackTitle, useCollapsingTitle } from '../components/common/CollapsingTitleBar';
import ScreenContent from '../components/common/ScreenContent';
import { Text } from '../components/common/Text';
import RoutineShelfCard from '../components/explore/RoutineShelfCard';
import { ROUTINE_SHELVES, routineShelfTemplates, type RoutineShelfId } from '../data/routineShelves';
import RoutineCategoryCard from '../features/selfCare/RoutineCategoryCard';
import { GOAL_SUGGESTION_CATEGORIES } from '../features/selfCare/goalSuggestions';
import { useIsRoutineAdded } from '../features/selfCare/useIsRoutineAdded';
import { triggerTapHaptic } from '../native/tapHaptics';
import { radius } from '../theme/card';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

export default function RoutineShelfScreen({ navigation, route }: RoutineShelfScreenProps) {
  const insets = useSafeAreaInsets();
  const isAdded = useIsRoutineAdded();
  const { scrollY, onScroll } = useCollapsingTitle();
  const [shelfId, setShelfId] = useState<RoutineShelfId>(route.params.shelfId);
  const openedOnLastChip = useRef(route.params.shelfId === ROUTINE_SHELVES.at(-1)?.id);
  const chips = useRef<ScrollView>(null);
  const shelf = ROUTINE_SHELVES.find((entry) => entry.id === shelfId) ?? ROUTINE_SHELVES[0];
  const categories = GOAL_SUGGESTION_CATEGORIES.filter((category) => shelf.categoryIds.includes(category.id));

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <CollapsingBackTitle title={shelf.label} />
        <View>
        <ScrollView
          ref={chips}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          onContentSizeChange={() => {
            if (!openedOnLastChip.current) return;
            openedOnLastChip.current = false;
            chips.current?.scrollToEnd({ animated: false });
          }}
        >
          {ROUTINE_SHELVES.map((entry) => {
            const selected = entry.id === shelf.id;
            return (
              <Pressable
                key={entry.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  triggerTapHaptic();
                  setShelfId(entry.id);
                }}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{entry.shortLabel}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        </View>
        <ScreenContent width="grouped" style={styles.body}>
          <View style={styles.grid}>
            {routineShelfTemplates(shelf).map((routine) => (
              <View key={routine.id} style={styles.tile}>
                <RoutineShelfCard
                  routine={routine}
                  added={isAdded(routine)}
                  onPress={() => navigation.navigate('RoutineLibraryDetail', { libraryId: routine.id })}
                />
              </View>
            ))}
          </View>
          {categories.length === 0 ? null : (
            <View style={styles.categories}>
              {shelf.categoriesTitle == null ? null : <Text style={styles.title}>{shelf.categoriesTitle}</Text>}
              {categories.map((category) => (
                <RoutineCategoryCard
                  key={category.id}
                  category={category}
                  variant="row"
                  onPress={() => navigation.navigate('RoutineCategory', { categoryId: category.id })}
                />
              ))}
            </View>
          )}
        </ScreenContent>
      </Animated.ScrollView>
      <CollapsingTitleBar title={shelf.label} scrollY={scrollY} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  chips: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.background.card,
  },
  chipSelected: {
    borderColor: colors.primary.blue500,
    backgroundColor: colors.primary.blue500,
  },
  chipLabel: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  chipLabelSelected: {
    color: colors.text.inverse,
  },
  body: {
    gap: spacing['2xl'],
    paddingHorizontal: padding.screen.horizontal,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  tile: {
    width: '48%',
  },
  categories: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    paddingBottom: spacing.sm,
  },
});
