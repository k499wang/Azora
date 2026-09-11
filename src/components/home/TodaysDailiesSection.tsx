import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import ActivityGlyph from '../explore/ActivityGlyph';
import Icon from '../common/icons/Icon';
import type { BreathingTechnique } from '../../features/exercise/guidedBreathing/techniques';
import { BREATH_HOLD_STYLE, CATEGORY_STYLE, TECHNIQUE_GLYPH, type CategoryStyle, type GlyphShape } from '../../features/exercise/guidedBreathing/categoryPalette';
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

const DAILY_GLYPH_SIZE = 38;

export interface DailyTaskRowProps {
  title: string;
  scheduledTime: string;
  detailLabel: string;
  style: CategoryStyle;
  glyph: GlyphShape;
  completed: boolean;
  locked: boolean;
  loading?: boolean;
  onPress?: () => void;
  isArranging: () => boolean;
  onMove: (delta: number) => void;
}

export type DailyRowContent = Omit<DailyTaskRowProps, 'isArranging' | 'onMove'>;

const EXERCISE_TITLES: Record<BreathingTechnique['id'], string> = {
  box: 'Focus Reset',
  '478': 'Sleep Reset',
  wimhof: 'Energy Reset',
  resonance: 'Balance Reset',
  relaxing: 'Stress Relief',
  belly: 'Grounding Exercise',
  'extended-exhale': 'Tension Release',
  sitali: 'Cooling Exercise',
  triangle: 'Concentration Reset',
  'deep-box': 'Deep Focus',
  bhastrika: 'Energy Activation',
  'morning-charge': 'Morning Reset',
  'night-settle': 'Evening Reset',
  'sleep-descent': 'Sleep Preparation',
  'coherent-6': 'Steady Rhythm',
};

function resolveExerciseTitle(technique: BreathingTechnique | null): string {
  return technique == null ? 'Daily Mental Reset' : EXERCISE_TITLES[technique.id];
}

export interface DailyRowsInput {
  technique: BreathingTechnique | null;
  techniqueLoading: boolean;
  handPickedTechnique: BreathingTechnique | null;
  handPickedTechniqueLoading: boolean;
  schedule: DailyPlanSchedule;
  guidedExerciseCompleted: boolean;
  handPickedExerciseCompleted: boolean;
  breathHoldCompleted: boolean;
  exerciseAccessAllowed: boolean;
  onPressGuidedExercise: () => void;
  onPressHandPickedExercise: () => void;
  onPressBreathHold: () => void;
}

export function buildDailyRows(input: DailyRowsInput): Record<DailyPlanActionId, DailyRowContent> {
  const { technique, techniqueLoading, handPickedTechnique, handPickedTechniqueLoading,
    schedule, guidedExerciseCompleted, handPickedExerciseCompleted, breathHoldCompleted,
    exerciseAccessAllowed, onPressGuidedExercise, onPressHandPickedExercise, onPressBreathHold } = input;
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
    checkIn: {
      title: 'Complete your daily check-in',
      scheduledTime: formatDailyPlanTime(schedule.actions.checkIn, DEFAULT_DAILY_PLAN_SCHEDULE.actions.checkIn),
      detailLabel: 'The Azora Protocol',
      style: BREATH_HOLD_STYLE,
      glyph: BREATH_HOLD_STYLE.glyph,
      completed: breathHoldCompleted,
      locked: !breathHoldCompleted && !exerciseAccessAllowed,
      onPress: onPressBreathHold,
    },
  };
}

export function DailyTaskRow({ title, scheduledTime, detailLabel, style, glyph,
  completed, locked, loading = false, isArranging, onPress, onMove }: DailyTaskRowProps) {
  const disabled = onPress == null || loading;
  const statusLabel = completed ? 'completed' : locked ? 'locked' : 'not completed';
  return (
    <View style={styles.taskRow}>
      <View style={[card.base, card.shadow, styles.taskCard]}>
        <ActivityGlyph shape={glyph} size={DAILY_GLYPH_SIZE} color={completed ? colors.text.tertiary : style.hue.mid} />
        <View style={styles.taskCopy}>
          <View style={styles.taskHeading}>
            <Text style={styles.taskType} numberOfLines={1}>{detailLabel}</Text>
            <Text style={[styles.taskTitle, completed && styles.taskContentMuted]} numberOfLines={2}>{title}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Icon name="clock" size={14} color={colors.text.tertiary} />
            <Text style={styles.metadataText}>{scheduledTime}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Start ${title}`}
          accessibilityHint={`${statusLabel}. Hold the card to rearrange today's list.`}
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
