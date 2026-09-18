import { Pressable, StyleSheet, View } from 'react-native';
import type { Ref } from 'react';
import { Text } from '../common/Text';
import ActivityGlyph from '../explore/ActivityGlyph';
import Icon from '../common/icons/Icon';
import Skeleton from '../common/Skeleton';
import type { BreathingTechnique } from '../../features/exercise/guidedBreathing/techniques';
import { resolveExerciseTitle } from '../../features/exercise/guidedBreathing/exerciseTitles';
import { CATEGORY_STYLE, TECHNIQUE_GLYPH, type CategoryStyle, type GlyphShape } from '../../features/exercise/guidedBreathing/categoryPalette';
import { card, radius } from '../../theme/card';
import { pressable } from '../../theme/pressable';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography, wrappedLineHeight } from '../../theme/typography';
import { TODAY_JOURNEY_CARD_MIN_HEIGHT } from './todayJourneyLayout';
import { formatDailyPlanTime, type DailyPlanActionId } from '../../services/dailyPlan/dailyPlanScheduleCore';
import { DEFAULT_DAILY_PLAN_SCHEDULE, type DailyPlanSchedule } from '../../services/dailyPlan/types';
import { journeyReorderActions } from './journey/useJourneyReorder';
import type { TodayProgramActivity } from '../../hooks/useTodayProgramDay';

const DAILY_GLYPH_SIZE = 38;
/** Placeholder bars stand exactly as tall as the lines they replace. */
const TASK_TYPE_LINE_HEIGHT = 12;
const TASK_TITLE_LINE_HEIGHT = wrappedLineHeight(typography.body.large.fontSize);

export interface DailyTaskRowProps {
  title: string;
  /** Null for a row that owns no hour, like the daily check-in. */
  scheduledTime: string | null;
  detailLabel: string;
  style: CategoryStyle;
  glyph: GlyphShape;
  completed: boolean;
  locked: boolean;
  loading?: boolean;
  onPress?: () => void;
  isArranging: () => boolean;
  onMove: (delta: number) => void;
  actionTarget?: { ref: Ref<View>; collapsable: false };
}

export type DailyRowContent = Omit<DailyTaskRowProps, 'isArranging' | 'onMove'>;


export interface DailyRowsInput {
  technique: BreathingTechnique | null;
  techniqueLoading: boolean;
  handPickedTechnique: BreathingTechnique | null;
  handPickedTechniqueLoading: boolean;
  schedule: DailyPlanSchedule;
  guidedExerciseCompleted: boolean;
  handPickedExerciseCompleted: boolean;
  exerciseAccessAllowed: boolean;
  onPressGuidedExercise: () => void;
  onPressHandPickedExercise: () => void;
}

export function buildDailyRows(input: DailyRowsInput): Partial<Record<DailyPlanActionId, DailyRowContent>> {
  const { technique, techniqueLoading, handPickedTechnique, handPickedTechniqueLoading,
    schedule, guidedExerciseCompleted, handPickedExerciseCompleted,
    exerciseAccessAllowed, onPressGuidedExercise, onPressHandPickedExercise } = input;
  return {
    session: {
      title: resolveExerciseTitle(technique),
      scheduledTime: formatDailyPlanTime(schedule.actions.session, DEFAULT_DAILY_PLAN_SCHEDULE.actions.session),
      detailLabel: technique?.name ?? 'Personalized for you',
      style: technique ? CATEGORY_STYLE[technique.category] : CATEGORY_STYLE.calm,
      glyph: technique ? TECHNIQUE_GLYPH[technique.id] : CATEGORY_STYLE.calm.glyph,
      completed: guidedExerciseCompleted,
      locked: !guidedExerciseCompleted && !exerciseAccessAllowed,
      loading: techniqueLoading,
      onPress: technique == null ? undefined : onPressGuidedExercise,
    },
    handPicked: {
      title: resolveExerciseTitle(handPickedTechnique),
      scheduledTime: formatDailyPlanTime(schedule.actions.handPicked, DEFAULT_DAILY_PLAN_SCHEDULE.actions.handPicked),
      detailLabel: handPickedTechnique?.name ?? 'Azora’s daily pick',
      style: handPickedTechnique ? CATEGORY_STYLE[handPickedTechnique.category] : CATEGORY_STYLE.balance,
      glyph: handPickedTechnique ? TECHNIQUE_GLYPH[handPickedTechnique.id] : CATEGORY_STYLE.balance.glyph,
      completed: handPickedExerciseCompleted,
      locked: !handPickedExerciseCompleted && !exerciseAccessAllowed,
      loading: handPickedTechniqueLoading,
      onPress: handPickedTechnique == null ? undefined : onPressHandPickedExercise,
    },
  };
}

export interface ProgramDailyRowsInput {
  activities: readonly TodayProgramActivity[];
  schedule: DailyPlanSchedule;
  exerciseAccessAllowed: boolean;
  onPressActivity: (activity: TodayProgramActivity) => void;
}

/**
 * Today's rows, from the plan.
 *
 * Keyed by the hour each exercise takes rather than by a fixed pair of names:
 * the day holds one in week one and three by the last, and the journey already
 * knows how to place a row by its slot. A slot the day does not fill simply has
 * no row, which is what lets the list grow without the ordering changing.
 *
 * The overline is the technique's own name, the same as the rows have always
 * carried. It briefly held the plan's reason for the day instead, which is a
 * sentence in a slot built for two words: set in caps at caption size, it
 * wrapped or truncated on every row and told the user less than the name did.
 */
export function buildProgramDailyRows({
  activities,
  schedule,
  exerciseAccessAllowed,
  onPressActivity,
}: ProgramDailyRowsInput): Partial<Record<DailyPlanActionId, DailyRowContent>> {
  const rows: Partial<Record<DailyPlanActionId, DailyRowContent>> = {};

  for (const activity of activities) {
    rows[activity.slot] = {
      // The same names the rows have always carried — "Focus Reset", not
      // "Box Breathing". The plan changed which exercise sits in a row and why;
      // it did not change what the app calls its exercises.
      title: resolveExerciseTitle(activity.technique),
      scheduledTime: formatDailyPlanTime(
        schedule.actions[activity.slot],
        DEFAULT_DAILY_PLAN_SCHEDULE.actions[activity.slot],
      ),
      detailLabel: activity.technique.name,
      style: CATEGORY_STYLE[activity.technique.category],
      glyph: TECHNIQUE_GLYPH[activity.technique.id],
      completed: activity.completed,
      locked: !activity.completed && !exerciseAccessAllowed,
      onPress: () => onPressActivity(activity),
    };
  }

  return rows;
}

/**
 * The daily check-in's row.
 *
 * Built here beside the exercise rows rather than in Home, because it is the
 * same row: the plan asks for it every day, it earns the same decoration, and a
 * second way of drawing a plan row is how the two start disagreeing about what
 * a finished one looks like.
 *
 * No scheduled time. Every other row on the list owns an hour, and this one
 * deliberately does not — an hour is a thing to be late for, and the one row
 * that asks how you are should not be able to make you late.
 */
export function buildMoodDailyRow({
  completed,
  loading,
  onPress,
}: {
  completed: boolean;
  loading: boolean;
  onPress: () => void;
}): DailyRowContent {
  return {
    title: 'Check in',
    scheduledTime: null,
    detailLabel: completed ? 'Answered today' : 'Four quick questions',
    style: MOOD_ROW_STYLE,
    glyph: MOOD_ROW_STYLE.glyph,
    completed,
    locked: false,
    loading,
    onPress,
  };
}

/** Its own colour, because it is not one of the breathing categories. */
const MOOD_ROW_STYLE: CategoryStyle = {
  label: 'Check in',
  hue: colors.playful.blush,
  glyph: 'bloom',
  character: 'calm',
};

export function DailyTaskRow({ title, scheduledTime, detailLabel, style, glyph,
  completed, locked, loading = false, isArranging, onPress, onMove, actionTarget }: DailyTaskRowProps) {
  const disabled = onPress == null || loading;
  const statusLabel = completed ? 'completed' : locked ? 'locked' : 'not completed';
  return (
    <View style={styles.taskRow}>
      <View style={[card.base, card.shadow, styles.taskCard]}>
        <ActivityGlyph shape={glyph} size={DAILY_GLYPH_SIZE} color={completed ? colors.text.tertiary : style.hue.mid} />
        <View style={styles.taskCopy}>
          {/* A name it does not have yet is not a name to print. Until the
              technique resolves, `title` is a generic stand-in and the row
              cannot be started — so the row says it is still loading rather
              than quietly showing the wrong exercise. */}
          {loading ? (
            <View style={styles.taskHeading}>
              <Skeleton width={96} height={TASK_TYPE_LINE_HEIGHT} />
              <Skeleton width="70%" height={TASK_TITLE_LINE_HEIGHT} />
            </View>
          ) : (
            <View style={styles.taskHeading}>
              <Text style={styles.taskType} numberOfLines={1}>{detailLabel}</Text>
              <Text style={[styles.taskTitle, completed && styles.taskContentMuted]} numberOfLines={2}>{title}</Text>
            </View>
          )}
          {scheduledTime == null ? null : (
            <View style={styles.metadataRow}>
              <Icon name="clock" size={14} color={colors.text.tertiary} />
              <Text style={styles.metadataText}>{scheduledTime}</Text>
            </View>
          )}
        </View>
        <View {...actionTarget}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={loading ? 'Loading today’s reset' : `Start ${title}`}
            accessibilityHint={`${statusLabel}. Hold the card to rearrange your plan.`}
            accessibilityState={{ disabled }}
            {...journeyReorderActions(onMove)}
            disabled={disabled}
            onPress={() => { if (!isArranging()) { triggerTapHaptic(); onPress?.(); } }}
            style={({ pressed }) => [styles.startButton, completed && styles.startButtonDone, disabled && pressable.disabled, pressed && pressable.control]}
          >
            <Icon name="play-triangle" size={20} color={completed ? colors.success[500] : colors.primary.blue400} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  taskRow: { flex: 1, minHeight: TODAY_JOURNEY_CARD_MIN_HEIGHT },
  taskCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.medium },
  taskCopy: { flex: 1, minWidth: 0, gap: 6 },
  taskHeading: { gap: 6 },
  taskType: { ...typography.overline, fontFamily: fonts.semibold, color: colors.text.tertiary },
  taskTitle: { ...typography.body.large, lineHeight: wrappedLineHeight(typography.body.large.fontSize), fontFamily: fonts.semibold, color: colors.text.primary },
  metadataRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metadataText: { ...typography.label.detail, color: colors.text.tertiary },
  taskContentMuted: { color: colors.text.tertiary, textDecorationLine: 'line-through' },
  startButtonDone: { backgroundColor: colors.success[100], borderColor: colors.success[300] },
  startButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.small, backgroundColor: colors.background.card, borderWidth: 1, borderBottomWidth: 3, borderColor: colors.border.default },
});
