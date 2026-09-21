import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RoutineCategoryScreenProps } from '../app/navigation';
import AppTopBar from '../components/common/AppTopBar';
import AnimatedSelectionToggle from '../components/common/AnimatedSelectionToggle';
import ChunkyButton from '../components/common/ChunkyButton';
import ScreenContent from '../components/common/ScreenContent';
import SectionHeader from '../components/common/SectionHeader';
import { Text } from '../components/common/Text';
import Icon from '../components/common/icons/Icon';
import {
  MAX_SELF_CARE_GOALS,
  selfCareGoalRecurrenceLabel,
} from '../features/selfCare/domain/selfCareGoal';
import { GOAL_SUGGESTION_CATEGORIES } from '../features/selfCare/goalSuggestions';
import { useRoutineSelection } from '../features/selfCare/useRoutineSelection';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { triggerTapHaptic } from '../native/tapHaptics';
import { useCreateSelfCareGoalsMutation } from '../queries/selfCare/useCreateSelfCareGoalsMutation';
import { useSelfCareGoalsQuery } from '../queries/selfCare/useSelfCareGoalsQuery';
import { useAuthStore } from '../stores/authStore';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { pressable } from '../theme/pressable';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

function routineDaypartLabel(scheduledTime: string): string {
  const hour = Number(scheduledTime.slice(0, 2));
  if (hour < 12) return 'Morning';
  if (hour < 14) return 'Noon';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

export default function RoutineCategoryScreen({ navigation, route }: RoutineCategoryScreenProps) {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const goalsQuery = useSelfCareGoalsQuery(userId, todayLocalDate);
  const createGoals = useCreateSelfCareGoalsMutation(userId, todayLocalDate);
  const category = useMemo(
    () => GOAL_SUGGESTION_CATEGORIES.find((entry) => entry.id === route.params.categoryId) ?? null,
    [route.params.categoryId],
  );
  const availableSlots = Math.max(0, MAX_SELF_CARE_GOALS - (goalsQuery.data?.length ?? 0));
  const selection = useRoutineSelection(category?.suggestions.map((item) => item.title) ?? [],
    availableSlots, userId != null && goalsQuery.isSuccess, createGoals.isPending);
  const { selectedIds: selectedTitles, allSelected } = selection;

  if (category == null) {
    navigation.goBack();
    return null;
  }

  const toggleSuggestion = (title: string) => {
    triggerTapHaptic();
    selection.toggle(title);
  };
  const toggleAll = () => {
    triggerTapHaptic();
    selection.toggleAll();
  };

  return (
    <View style={styles.screen}>
      <AppTopBar
        title={category.label}
        showBack
        showAvatar={false}
        showStreak={false}
      />
      <FlatList
        data={category.suggestions}
        keyExtractor={(item) => item.title}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <ScreenContent width="grouped" style={styles.header}>
            <SectionHeader
              title="Choose routines"
              right={(
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={allSelected ? 'Clear all routines' : 'Add all routines'}
                disabled={selection.locked || (availableSlots === 0 && selectedTitles.length === 0)}
                onPress={toggleAll}
                hitSlop={spacing.sm}
                style={({ pressed }) => [
                  pressed && pressable.subtle,
                  availableSlots === 0 && styles.addAllDisabled,
                ]}
              >
                <Text style={styles.addAll}>
                  {allSelected ? 'Clear all' : 'Add all'}
                </Text>
              </Pressable>
              )}
            />
            <Text style={styles.description}>{category.description}</Text>
            {availableSlots === 0 ? <Text style={styles.limit}>Your routine is full.</Text> : null}
            {selection.overCapacity ? <Text style={styles.limit}>Choose up to {availableSlots} routines to fit your list.</Text> : null}
            {goalsQuery.isPending ? <Text style={styles.description}>Loading your routine…</Text> : null}
            {goalsQuery.isError ? <Text style={styles.error}>{errorMessage(goalsQuery.error)}</Text> : null}
          </ScreenContent>
        )}
        renderItem={({ item }) => {
          const selected = selectedTitles.includes(item.title);
          const disabled = selection.locked || (!selected && selectedTitles.length >= availableSlots);
          return (
            <ScreenContent width="grouped">
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled }}
                accessibilityLabel={item.title}
                disabled={disabled}
                onPress={() => toggleSuggestion(item.title)}
                style={({ pressed }) => [
                  card.base,
                  card.shadow,
                  styles.row,
                  pressed && pressable.surface,
                  disabled && styles.disabled,
                ]}
              >
                <View style={styles.iconBadge}>
                  <Icon name={item.icon} size={38} color={colors.primary.blue500} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <View style={styles.repeat}>
                    <Icon name="streak" size={16} color={colors.text.secondary} />
                    <Text style={styles.repeatLabel}>
                      {selfCareGoalRecurrenceLabel(item.recurrence)}
                    </Text>
                    <Text style={styles.metadataDivider}>·</Text>
                    <Icon name="clock" size={16} color={colors.text.secondary} />
                    <Text style={styles.repeatLabel}>
                      {routineDaypartLabel(item.scheduledTime)}
                    </Text>
                  </View>
                </View>
                <AnimatedSelectionToggle selected={selected} />
              </Pressable>
            </ScreenContent>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <View style={[styles.actionTray, { paddingBottom: insets.bottom + spacing.md }]}>
        <ScreenContent width="grouped" style={styles.actionContent}>
          <ChunkyButton
            shape="card"
            label={selectedTitles.length === 0 ? 'Add to My Routine' : `Add ${selectedTitles.length} to My Routine`}
            disabled={!selection.canSubmit}
            loading={createGoals.isPending}
            onPress={() => { void selection.submit(async () => {
              await createGoals.mutateAsync(category.suggestions
                .filter((item) => selectedTitles.includes(item.title))
                .map(({ title, icon, recurrence, scheduledTime }) => ({
                  title,
                  icon,
                  recurrence,
                  scheduledTime,
                })));
              if (navigation.isFocused()) navigation.goBack();
            }); }}
          />
          {createGoals.isError ? <Text style={styles.error}>{errorMessage(createGoals.error)}</Text> : null}
        </ScreenContent>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  addAll: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.brand,
  },
  addAllDisabled: {
    opacity: 0.45,
  },
  description: {
    ...typography.body.medium,
    color: colors.text.secondary,
    paddingTop: spacing.sm,
  },
  limit: {
    ...typography.label.detail,
    color: colors.error[700],
    paddingTop: spacing.sm,
  },
  row: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  iconBadge: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  repeat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  repeatLabel: {
    ...typography.label.medium,
    fontFamily: fonts.medium,
    color: colors.text.tertiary,
  },
  metadataDivider: {
    ...typography.label.medium,
    color: colors.text.tertiary,
  },
  separator: {
    height: spacing.sm,
  },
  disabled: {
    opacity: 0.45,
  },
  actionTray: {
    ...card.trayShadow,
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
  },
  actionContent: {
    gap: spacing.sm,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
});
