import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RoutineLibraryDetailScreenProps } from '../app/navigation';
import AppTopBar from '../components/common/AppTopBar';
import CoinWorth from '../components/common/CoinWorth';
import AnimatedSelectionToggle from '../components/common/AnimatedSelectionToggle';
import ChunkyButton, { CHUNKY_TONE_QUIET } from '../components/common/ChunkyButton';
import RoutineLibraryArt from '../components/explore/RoutineLibraryArt';
import ScreenContent from '../components/common/ScreenContent';
import SectionHeader from '../components/common/SectionHeader';
import { Text } from '../components/common/Text';
import Icon from '../components/common/icons/Icon';
import TaskIllustration from '../components/common/icons/TaskIllustration';
import TaskCardBody, { taskCard } from '../components/home/journey/TaskCardBody';
import {
  getRoutineLibraryEntry,
  routineTemplateDrafts,
  type RoutineTemplate,
} from '../data/routineLibrary';
import { routineFacts } from '../data/routineShelves';
import { getRoutineGuide } from '../data/routineGuides';
import { routineTipIcon } from '../data/routineTipIcon';
import RoutineTaskIcon from '../features/selfCare/RoutineTaskIcon';
import { useAddRoutinePreset } from '../features/selfCare/useAddRoutinePreset';
import { useRoutineSelection } from '../features/selfCare/useRoutineSelection';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { triggerTapHaptic } from '../native/tapHaptics';
import { useCreateSelfCareGoalsMutation } from '../queries/selfCare/useCreateSelfCareGoalsMutation';
import { useSelfCareGoalsQuery } from '../queries/selfCare/useSelfCareGoalsQuery';
import { trackRoutinePresetAdded } from '../services/analytics/tracking';
import { shareHouseCleaningPdf, previewHouseCleaningPdf } from '../services/routineLibrary/houseCleaningPdf';
import { useAuthStore } from '../stores/authStore';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { pressable } from '../theme/pressable';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const GUIDE_ICON_SIZE = 36;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

function TemplateDetail({ entry, navigation }: { entry: RoutineTemplate; navigation: RoutineLibraryDetailScreenProps['navigation'] }) {
  const guide = getRoutineGuide(entry.id);
  const facts = routineFacts(entry);
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const goalsQuery = useSelfCareGoalsQuery(userId, todayLocalDate);
  const createGoals = useCreateSelfCareGoalsMutation(userId, todayLocalDate);
  const selection = useRoutineSelection(entry.tasks.map((task) => task.id),
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
  const { addToRoutine, isLoading: isRoutinePresetAccessLoading } = useAddRoutinePreset({
    sourceScreen: 'RoutineLibraryDetail',
    onAllowed: () => {
    void selection.submit(async () => {
      await createGoals.mutateAsync(routineTemplateDrafts(selectedTasks));
      trackRoutinePresetAdded({ routine: entry.id, tasks: selectedTasks.length });
      if (navigation.isFocused()) navigation.goBack();
    });
    },
  });

  return (
    <View style={styles.screen}>
      <AppTopBar title={entry.title} showBack showAvatar={false} showStreak={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenContent width="grouped">
          <RoutineLibraryArt entry={entry} size="hero" />
          <View style={styles.facts}>
            <TaskIllustration name="streak" size={16} />
            <Text style={styles.fact}>{facts.repeat}</Text>
            <Text style={styles.factDivider}>·</Text>
            <Icon name="clock" size={16} color={colors.text.secondary} />
            <Text style={styles.fact}>{facts.minutes}</Text>
            <Text style={styles.factDivider}>·</Text>
            <Icon name="checklist" size={16} color={colors.text.secondary} />
            <Text style={styles.fact}>{facts.steps}</Text>
            <Text style={styles.factDivider}>·</Text>
            <CoinWorth coins={facts.coins} />
          </View>
          <Text style={styles.lead}>{entry.description}</Text>
          {guide ? (
            <>
              <View style={styles.guideSection}>
                <SectionHeader title="About this routine" />
                <View style={styles.introduction}>
                  {guide.introduction.map((paragraph) => (
                    <Text key={paragraph} style={styles.guideCopy}>{paragraph}</Text>
                  ))}
                </View>
              </View>
              <View style={styles.guideSection}>
                <SectionHeader title="Before you begin" />
                <View style={styles.tips}>
                  {guide.preparation.map((tip) => (
                    <View key={tip} style={styles.tip}>
                      <TaskIllustration name={routineTipIcon(tip)} size={GUIDE_ICON_SIZE} />
                      <Text style={[styles.guideCopy, styles.tipCopy]}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : null}
          {guide ? (
            <View style={styles.guideSection}>
              <SectionHeader title="How to do it" />
              <View style={styles.tips}>
                {entry.tasks.map((task) => (
                  <View key={task.id} style={styles.tip}>
                    <TaskIllustration name={task.icon} size={GUIDE_ICON_SIZE} />
                    <View style={styles.tipCopy}>
                      <Text style={styles.howTitle}>{task.title}</Text>
                      <Text style={styles.guideCopy}>{guide.taskDescriptions[task.id]}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          <View style={styles.tasksHeader}>
            <SectionHeader
              title="Choose tasks"
              right={(
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={allSelected ? 'Clear all tasks' : 'Add all tasks'}
                  disabled={selection.locked}
                  onPress={toggleAll}
                  hitSlop={spacing.sm}
                  style={({ pressed }) => [pressed && pressable.subtle]}
                >
                  <Text style={styles.addAll}>{allSelected ? 'Clear all' : 'Add all'}</Text>
                </Pressable>
              )}
            />
          </View>
          {goalsQuery.isPending ? <Text style={styles.description}>Loading your routine…</Text> : null}
          {goalsQuery.isError ? <Text style={styles.error}>{errorMessage(goalsQuery.error)}</Text> : null}
          <View style={styles.rows}>
            {entry.tasks.map((task) => {
              const selected = selectedIds.includes(task.id);
              const disabled = selection.locked;
              return (
                <Pressable
                  key={task.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled }}
                  accessibilityLabel={`${task.title}, ${task.durationMinutes} min`}
                  accessibilityHint={guide?.taskDescriptions[task.id]}
                  disabled={disabled}
                  onPress={() => toggle(task.id)}
                  style={({ pressed }) => [taskCard.surface, pressed && pressable.surface, disabled && styles.disabled]}
                >
                  <View style={taskCard.face}>
                    <TaskCardBody
                      icon={<RoutineTaskIcon name={task.icon} />}
                      badge={<AnimatedSelectionToggle selected={selected} />}
                    >
                      <Text style={taskCard.title}>{task.title}</Text>
                      <Text style={taskCard.detail}>{task.durationMinutes} min</Text>
                    </TaskCardBody>
                  </View>
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
            disabled={!selection.canSubmit || isRoutinePresetAccessLoading}
            loading={createGoals.isPending}
            onPress={addToRoutine}
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
  content: { paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  pdfContent: { paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.lg, paddingBottom: spacing['7xl'] },
  eyebrow: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.text.brand, textTransform: 'uppercase', letterSpacing: 0.6, paddingTop: spacing.lg },
  title: { ...typography.title.title2, fontFamily: fonts.semibold, color: colors.text.primary, paddingTop: spacing.xs },
  facts: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: spacing.xs, paddingTop: spacing.lg },
  fact: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.text.secondary },
  factDivider: { ...typography.label.medium, color: colors.text.tertiary, paddingHorizontal: spacing.xs },
  lead: { ...typography.body.large, fontFamily: fonts.semibold, textAlign: 'center', color: colors.text.primary, paddingTop: spacing.md },
  description: { ...typography.body.medium, color: colors.text.secondary, paddingTop: spacing.sm },
  introduction: { gap: spacing.md, paddingTop: spacing.sm },
  guideCopy: { ...typography.body.medium, color: colors.text.secondary },
  guideSection: { paddingTop: spacing.xl },
  tips: { gap: spacing.md, paddingTop: spacing.md },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  tipCopy: { flex: 1 },
  howTitle: { ...typography.body.large, fontFamily: fonts.semibold, color: colors.text.primary, paddingBottom: spacing.xs },
  tasksHeader: { paddingTop: spacing.xl },
  addAll: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.text.brand },
  rows: { gap: spacing.sm, paddingTop: spacing.sm },
  tray: { ...card.trayShadow, paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border.subtle, backgroundColor: colors.background.canvas },
  disabled: { opacity: 0.45 },
  error: { ...typography.label.medium, color: colors.error[700], textAlign: 'center', paddingTop: spacing.sm },
  pdfMeta: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.text.tertiary, paddingTop: spacing.md },
  sourceNote: { ...typography.body.small, color: colors.text.secondary, paddingTop: spacing.sm },
  pdfActions: { gap: spacing.md, paddingTop: spacing.xl },
});
