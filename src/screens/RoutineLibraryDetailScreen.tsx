import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RoutineLibraryDetailScreenProps } from '../app/navigation';
import AppTopBar from '../components/common/AppTopBar';
import AnimatedSelectionToggle from '../components/common/AnimatedSelectionToggle';
import ChunkyButton, { CHUNKY_TONE_QUIET } from '../components/common/ChunkyButton';
import RoutineLibraryArt from '../components/explore/RoutineLibraryArt';
import ScreenContent from '../components/common/ScreenContent';
import SectionHeader from '../components/common/SectionHeader';
import { Text } from '../components/common/Text';
import Icon from '../components/common/icons/Icon';
import {
  getRoutineLibraryEntry,
  routineTemplateDrafts,
  type RoutineTemplate,
} from '../data/routineLibrary';
import { MAX_SELF_CARE_GOALS } from '../features/selfCare/domain/selfCareGoal';
import { useRoutineSelection } from '../features/selfCare/useRoutineSelection';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { triggerTapHaptic } from '../native/tapHaptics';
import { useCreateSelfCareGoalsMutation } from '../queries/selfCare/useCreateSelfCareGoalsMutation';
import { useSelfCareGoalsQuery } from '../queries/selfCare/useSelfCareGoalsQuery';
import { shareHouseCleaningPdf, previewHouseCleaningPdf } from '../services/routineLibrary/houseCleaningPdf';
import { useAuthStore } from '../stores/authStore';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { pressable } from '../theme/pressable';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

function TemplateDetail({ entry, navigation }: { entry: RoutineTemplate; navigation: RoutineLibraryDetailScreenProps['navigation'] }) {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const goalsQuery = useSelfCareGoalsQuery(userId, todayLocalDate);
  const createGoals = useCreateSelfCareGoalsMutation(userId, todayLocalDate);
  const availableSlots = Math.max(0, MAX_SELF_CARE_GOALS - (goalsQuery.data?.length ?? 0));
  const selection = useRoutineSelection(entry.tasks.map((task) => task.id), availableSlots,
    userId != null && goalsQuery.isSuccess, createGoals.isPending, true);
  const { selectedIds, allSelected } = selection;
  const selectedTasks = useMemo(
    () => entry.tasks.filter((task) => selectedIds.includes(task.id)),
    [entry.tasks, selectedIds],
  );
  const toggle = (id: string) => {
    triggerTapHaptic();
    selection.toggle(id);
  };
  const toggleAll = () => {
    triggerTapHaptic();
    selection.toggleAll();
  };

  return (
    <View style={styles.screen}>
      <AppTopBar title={entry.title} showBack showAvatar={false} showStreak={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenContent width="grouped">
          <RoutineLibraryArt entry={entry} size="hero" />
          <Text style={styles.title}>{entry.title}</Text>
          <Text style={styles.description}>{entry.description}</Text>
          <View style={styles.tasksHeader}>
            <SectionHeader
              title="Choose tasks"
              right={(
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={allSelected ? 'Clear all tasks' : 'Add all tasks'}
                  disabled={selection.locked || (availableSlots === 0 && selectedIds.length === 0)}
                  onPress={toggleAll}
                  hitSlop={spacing.sm}
                  style={({ pressed }) => [pressed && pressable.subtle, availableSlots === 0 && styles.disabled]}
                >
                  <Text style={styles.addAll}>{allSelected ? 'Clear all' : 'Add all'}</Text>
                </Pressable>
              )}
            />
          </View>
          {availableSlots === 0 ? <Text style={styles.limit}>Your routine is full.</Text> : null}
          {selection.overCapacity ? <Text style={styles.limit}>Choose up to {availableSlots} tasks to fit your routine.</Text> : null}
          {goalsQuery.isPending ? <Text style={styles.description}>Loading your routine…</Text> : null}
          {goalsQuery.isError ? <Text style={styles.error}>{errorMessage(goalsQuery.error)}</Text> : null}
          <View style={styles.rows}>
            {entry.tasks.map((task) => {
              const selected = selectedIds.includes(task.id);
              const disabled = selection.locked || (!selected && selectedIds.length >= availableSlots);
              return (
                <Pressable
                  key={task.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled }}
                  accessibilityLabel={task.title}
                  disabled={disabled}
                  onPress={() => toggle(task.id)}
                  style={({ pressed }) => [card.base, card.shadow, styles.row, pressed && pressable.surface, disabled && styles.disabled]}
                >
                  <Icon name={task.icon} size={24} color={colors.primary.blue500} />
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{task.title}</Text>
                    <Text style={styles.rowMeta}>Repeats daily · Anytime</Text>
                  </View>
                  <AnimatedSelectionToggle selected={selected} />
                </Pressable>
              );
            })}
          </View>
        </ScreenContent>
      </ScrollView>
      <View style={[styles.tray, { paddingBottom: insets.bottom + spacing.md }]}>
        <ScreenContent width="grouped">
          <ChunkyButton
            shape="card"
            label={selectedTasks.length === 0 ? 'Add to My Routine' : `Add ${selectedTasks.length} to My Routine`}
            disabled={!selection.canSubmit}
            loading={createGoals.isPending}
            onPress={() => { void selection.submit(async () => {
              await createGoals.mutateAsync(routineTemplateDrafts(selectedTasks));
              if (navigation.isFocused()) navigation.goBack();
            }); }}
          />
          {createGoals.isError ? <Text style={styles.error}>{errorMessage(createGoals.error)}</Text> : null}
        </ScreenContent>
      </View>
    </View>
  );
}

function PdfDetail({ route }: Pick<RoutineLibraryDetailScreenProps, 'route'>) {
  const entry = getRoutineLibraryEntry(route.params.libraryId);
  const [error, setError] = useState<string | null>(null);
  if (entry == null || entry.kind !== 'pdf') return null;
  const perform = (action: () => Promise<void>) => {
    triggerTapHaptic();
    setError(null);
    void action().catch((reason: unknown) => setError(errorMessage(reason)));
  };
  return (
    <View style={styles.screen}>
      <AppTopBar title="House cleaning guide" showBack showAvatar={false} showStreak={false} />
      <ScrollView contentContainerStyle={styles.pdfContent} showsVerticalScrollIndicator={false}>
        <ScreenContent width="grouped">
          <RoutineLibraryArt entry={entry} size="hero" />
          <Text style={styles.eyebrow}>{entry.eyebrow}</Text>
          <Text style={styles.title}>{entry.title}</Text>
          <Text style={styles.description}>{entry.description}</Text>
          <Text style={styles.pdfMeta}>PDF · 10 pages</Text>
          <Text style={styles.sourceNote}>{entry.sourceNote}</Text>
          <View style={styles.pdfActions}>
            <ChunkyButton shape="card" label="Preview PDF" onPress={() => perform(previewHouseCleaningPdf)} />
            <ChunkyButton shape="card" tone={CHUNKY_TONE_QUIET} label="Share or Save PDF" onPress={() => perform(shareHouseCleaningPdf)} />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScreenContent>
      </ScrollView>
    </View>
  );
}

export default function RoutineLibraryDetailScreen(props: RoutineLibraryDetailScreenProps) {
  const entry = getRoutineLibraryEntry(props.route.params.libraryId);
  if (entry == null) return null;
  return entry.kind === 'template'
    ? <TemplateDetail key={entry.id} entry={entry} navigation={props.navigation} />
    : <PdfDetail route={props.route} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  content: { paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.lg, paddingBottom: 180 },
  pdfContent: { paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.lg, paddingBottom: spacing['7xl'] },
  eyebrow: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.text.brand, textTransform: 'uppercase', letterSpacing: 0.6, paddingTop: spacing.lg },
  title: { ...typography.title.title2, fontFamily: fonts.semibold, color: colors.text.primary, paddingTop: spacing.xs },
  description: { ...typography.body.medium, color: colors.text.secondary, paddingTop: spacing.sm },
  tasksHeader: { paddingTop: spacing.lg },
  addAll: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.text.brand },
  rows: { gap: spacing.sm, paddingTop: spacing.md },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowCopy: { flex: 1, gap: 6 },
  rowTitle: { ...typography.body.large, fontFamily: fonts.semibold, color: colors.text.primary },
  rowMeta: { ...typography.label.detail, color: colors.text.tertiary },
  tray: { ...card.trayShadow, paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border.subtle, backgroundColor: colors.background.canvas },
  disabled: { opacity: 0.45 },
  limit: { ...typography.label.medium, color: colors.error[700], paddingTop: spacing.sm },
  error: { ...typography.label.medium, color: colors.error[700], textAlign: 'center', paddingTop: spacing.sm },
  pdfMeta: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.text.tertiary, paddingTop: spacing.md },
  sourceNote: { ...typography.body.small, color: colors.text.secondary, paddingTop: spacing.sm },
  pdfActions: { gap: spacing.md, paddingTop: spacing.xl },
});
