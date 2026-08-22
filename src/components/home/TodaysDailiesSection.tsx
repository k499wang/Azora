import { Text } from '../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ActivityGlyph from '../explore/ActivityGlyph';
import SectionHeader from '../common/SectionHeader';
import Icon from '../common/icons/Icon';
import {
  formatPattern,
  type BreathingTechnique,
} from '../../features/exercise/guidedBreathing/techniques';
import {
  BREATH_HOLD_STYLE,
  CATEGORY_STYLE,
  TECHNIQUE_GLYPH,
  type CategoryStyle,
  type GlyphShape,
} from '../../features/exercise/guidedBreathing/categoryPalette';
import { card, radius } from '../../theme/card';
import { pressable } from '../../theme/pressable';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import {
  formatDailyPlanTime,
  sortDailyPlanActionIdsByTime,
  type DailyPlanActionId,
} from '../../services/dailyPlan/dailyPlanScheduleCore';
import { DEFAULT_DAILY_PLAN_SCHEDULE } from '../../services/dailyPlan/types';

const TIMELINE_COLUMN_WIDTH = 40;
const TIMELINE_MARKER_SIZE = 22;
const MARKER_ICON_SIZE = 14;
const TIMELINE_RAIL_WIDTH = 6;
const TIMELINE_ROW_HEIGHT = 160;
const TASK_CONTENT_SIZE = 128;
// Oversized and bled off the corner so it reads as a watermark behind the copy,
// matching the extra-practice shelf cards.
const TASK_GLYPH_SIZE = 150;
const TASK_GLYPH_RIGHT = -34;
const TASK_GLYPH_BOTTOM = -40;
const TASK_COPY_INSET = 72;
const TIMELINE_ROW_GAP = spacing.lg;
const TIMELINE_RAIL_INSET = TIMELINE_ROW_HEIGHT / 2 + TIMELINE_MARKER_SIZE / 2;
const TIMELINE_RAIL_LEFT = TIMELINE_COLUMN_WIDTH / 2 - TIMELINE_RAIL_WIDTH / 2;
const TIMELINE_DASHES = Array.from({ length: 17 }, (_, index) => index);
// Diagonal, deepest at the top-left. Stops at `mid` rather than `soft` so the
// card reads as one saturated hue with depth, not a fade out to near-white.
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };

interface TodaysDailiesSectionProps {
  technique: BreathingTechnique | null;
  techniqueLoading: boolean;
  sessionTime: string;
  handPickedTechnique: BreathingTechnique | null;
  handPickedTechniqueLoading: boolean;
  handPickedTime: string;
  breathHoldTime: string;
  guidedExerciseCompleted: boolean;
  handPickedExerciseCompleted: boolean;
  breathHoldCompleted: boolean;
  exerciseAccessAllowed: boolean;
  onPressGuidedExercise: () => void;
  onPressHandPickedExercise: () => void;
  onPressBreathHold: () => void;
  onPressHistory: () => void;
}

interface DailyTaskRowProps {
  title: string;
  scheduledTime: string;
  techniqueMeta: string | null;
  detailLabel: string;
  detailIcon: BreathingTechnique['icon'];
  style: CategoryStyle;
  glyph: GlyphShape;
  completed: boolean;
  locked: boolean;
  loading?: boolean;
  onPress?: () => void;
}

function formatCategory(category: BreathingTechnique['category']): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// How long it takes and the rhythm it runs at — the breath hold has neither.
function techniqueMetaLabel(technique: BreathingTechnique | null): string | null {
  if (technique == null) return null;
  return `${technique.duration} · ${formatPattern(technique.pattern)}`;
}

function DailyTaskRow({
  title,
  scheduledTime,
  techniqueMeta,
  detailLabel,
  detailIcon,
  style,
  glyph,
  completed,
  locked,
  loading = false,
  onPress,
}: DailyTaskRowProps) {
  const unavailable = onPress == null;
  const statusLabel = completed ? 'completed' : locked ? 'locked' : 'not completed';

  return (
    <Pressable
      onPress={() => {
        triggerTapHaptic();
        onPress?.();
      }}
      disabled={unavailable}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${detailLabel}, scheduled for ${scheduledTime}${techniqueMeta == null ? '' : `, ${techniqueMeta}`}, ${statusLabel}`}
      accessibilityState={{ disabled: unavailable }}
      style={({ pressed }) => [styles.taskRow, pressed && styles.taskPressed]}
    >
      <View style={styles.timelineColumn} pointerEvents="none">
        <View
          style={[
            styles.statusMarker,
            completed
              ? styles.statusMarkerCompleted
              : locked
                ? styles.statusMarkerLocked
                : styles.statusMarkerActive,
          ]}
        >
          {completed || locked ? (
            <Icon
              name={completed ? 'check' : 'lock'}
              size={MARKER_ICON_SIZE}
              color={colors.text.inverse}
            />
          ) : null}
        </View>
      </View>

      <View
        style={[styles.taskPillShadow, { backgroundColor: style.hue.base }]}
      >
        <LinearGradient
          colors={[style.hue.base, style.hue.mid]}
          start={GRADIENT_START}
          end={GRADIENT_END}
          style={styles.taskPill}
        >
          <View
            style={[styles.taskGlyph, loading && styles.taskGlyphLoading]}
            pointerEvents="none"
          >
            <ActivityGlyph
              shape={glyph}
              size={TASK_GLYPH_SIZE}
              color={colors.text.inverse}
              opacity={0.16}
            />
          </View>

          <View style={styles.taskCopy} pointerEvents="none">
            <View style={styles.taskTop}>
              <Text style={styles.taskTitle} numberOfLines={2}>
                {title}
              </Text>
              {techniqueMeta == null ? null : (
                <View style={styles.metaPill}>
                  <Text style={[styles.metaPillText, { color: style.hue.ink }]}>
                    {techniqueMeta}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.metadataStack}>
              <View style={styles.metadataRow}>
                <MaterialCommunityIcons
                  name={detailIcon}
                  size={14}
                  color={colors.onBlock.textMuted}
                />
                <Text style={styles.metadataText} numberOfLines={1}>
                  {detailLabel}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Icon name="clock" size={14} color={colors.onBlock.textMuted} />
                <Text style={styles.metadataText} numberOfLines={1}>
                  {scheduledTime}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export default function TodaysDailiesSection({
  technique,
  techniqueLoading,
  sessionTime,
  handPickedTechnique,
  handPickedTechniqueLoading,
  handPickedTime,
  breathHoldTime,
  guidedExerciseCompleted,
  handPickedExerciseCompleted,
  breathHoldCompleted,
  exerciseAccessAllowed,
  onPressGuidedExercise,
  onPressHandPickedExercise,
  onPressBreathHold,
  onPressHistory,
}: TodaysDailiesSectionProps) {
  const guidedLocked = !guidedExerciseCompleted && !exerciseAccessAllowed;
  const handPickedLocked =
    !handPickedExerciseCompleted && !exerciseAccessAllowed;
  const breathHoldLocked = !breathHoldCompleted && !exerciseAccessAllowed;
  const guidedTitle = technique?.name ?? 'Your breathing exercise';
  const guidedScheduledTime = formatDailyPlanTime(
    sessionTime,
    DEFAULT_DAILY_PLAN_SCHEDULE.actions.session,
  );
  const breathHoldScheduledTime = formatDailyPlanTime(
    breathHoldTime,
    DEFAULT_DAILY_PLAN_SCHEDULE.actions.checkIn,
  );
  const handPickedScheduledTime = formatDailyPlanTime(
    handPickedTime,
    DEFAULT_DAILY_PLAN_SCHEDULE.actions.handPicked,
  );
  const guidedDetail = technique == null
    ? 'Personalized for you'
    : `${formatCategory(technique.category)} breathing`;
  const guidedDetailIcon = technique?.icon ?? 'weather-windy';
  const rows: Record<DailyPlanActionId, DailyTaskRowProps> = {
    session: {
      title: guidedTitle,
      scheduledTime: guidedScheduledTime,
      techniqueMeta: techniqueMetaLabel(technique),
      detailLabel: guidedDetail,
      detailIcon: guidedDetailIcon,
      style: technique
        ? CATEGORY_STYLE[technique.category]
        : CATEGORY_STYLE.calm,
      glyph: technique
        ? TECHNIQUE_GLYPH[technique.id]
        : CATEGORY_STYLE.calm.glyph,
      completed: guidedExerciseCompleted,
      locked: guidedLocked,
      loading: techniqueLoading,
      onPress: technique == null ? undefined : onPressGuidedExercise,
    },
    handPicked: {
      title: handPickedTechnique?.name ?? 'Azora’s daily pick',
      scheduledTime: handPickedScheduledTime,
      techniqueMeta: techniqueMetaLabel(handPickedTechnique),
      detailLabel: 'Azora’s daily pick',
      detailIcon: handPickedTechnique?.icon ?? 'creation-outline',
      style: handPickedTechnique
        ? CATEGORY_STYLE[handPickedTechnique.category]
        : CATEGORY_STYLE.balance,
      glyph: handPickedTechnique
        ? TECHNIQUE_GLYPH[handPickedTechnique.id]
        : CATEGORY_STYLE.balance.glyph,
      completed: handPickedExerciseCompleted,
      locked: handPickedLocked,
      loading: handPickedTechniqueLoading,
      onPress:
        handPickedTechnique == null ? undefined : onPressHandPickedExercise,
    },
    checkIn: {
      title: 'Daily Breathhold',
      scheduledTime: breathHoldScheduledTime,
      techniqueMeta: null,
      detailLabel: 'Daily check-in',
      detailIcon: 'timer-sand',
      style: BREATH_HOLD_STYLE,
      glyph: BREATH_HOLD_STYLE.glyph,
      completed: breathHoldCompleted,
      locked: breathHoldLocked,
      onPress: onPressBreathHold,
    },
  };
  const orderedActionIds = sortDailyPlanActionIdsByTime({
    session: sessionTime,
    handPicked: handPickedTime,
    checkIn: breathHoldTime,
  });

  return (
    <View style={styles.section}>
      <SectionHeader
        icon="calendar"
        title="Today’s Dailies"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your history"
            hitSlop={spacing.sm}
            onPress={() => {
              triggerTapHaptic();
              onPressHistory();
            }}
            style={({ pressed }) => [
              styles.historyLink,
              pressed && styles.historyLinkPressed,
            ]}
          >
            <Text style={styles.historyLinkText}>History</Text>
            <Icon name="chevron-right" size={16} color={colors.text.brand} />
          </Pressable>
        }
      />

      <View style={styles.timeline}>
        <View style={styles.timelineRail} pointerEvents="none">
          {TIMELINE_DASHES.map((dash) => (
            <View key={dash} style={styles.timelineRailDash} />
          ))}
        </View>
        {orderedActionIds.map((actionId) => (
          <DailyTaskRow key={actionId} {...rows[actionId]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  historyLinkText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.brand,
  },
  historyLinkPressed: {
    opacity: 0.6,
  },
  timeline: {
    position: 'relative',
    gap: TIMELINE_ROW_GAP,
  },
  timelineRail: {
    position: 'absolute',
    top: TIMELINE_RAIL_INSET,
    bottom: TIMELINE_RAIL_INSET,
    left: TIMELINE_RAIL_LEFT,
    width: TIMELINE_RAIL_WIDTH,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineRailDash: {
    width: TIMELINE_RAIL_WIDTH,
    height: 10,
    borderRadius: TIMELINE_RAIL_WIDTH / 2,
    backgroundColor: colors.border.default,
  },
  taskRow: {
    height: TIMELINE_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  taskPressed: pressable.subtle,
  timelineColumn: {
    width: TIMELINE_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  statusMarker: {
    width: TIMELINE_MARKER_SIZE,
    height: TIMELINE_MARKER_SIZE,
    borderRadius: TIMELINE_MARKER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusMarkerActive: {
    backgroundColor: colors.primary.blue600,
  },
  statusMarkerCompleted: {
    backgroundColor: colors.success[500],
  },
  statusMarkerLocked: {
    backgroundColor: colors.neutral[400],
  },
  taskPillShadow: {
    ...card.blockShadow,
    flex: 1,
    borderRadius: radius.hero,
  },
  taskPill: {
    height: TIMELINE_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.hero,
    overflow: 'hidden',
  },
  taskGlyph: {
    position: 'absolute',
    right: TASK_GLYPH_RIGHT,
    bottom: TASK_GLYPH_BOTTOM,
  },
  taskGlyphLoading: {
    opacity: 0.45,
  },
  taskCopy: {
    flex: 1,
    minWidth: 0,
    height: TASK_CONTENT_SIZE,
    justifyContent: 'space-between',
  },
  taskTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  metaPill: {
    borderRadius: radius.full,
    backgroundColor: colors.text.inverse,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  metaPillText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
  },
  taskTitle: {
    flex: 1,
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  metadataStack: {
    gap: spacing.xs,
    paddingRight: TASK_COPY_INSET,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metadataText: {
    ...typography.label.detail,
    fontSize: 14,
    lineHeight: 18,
    color: colors.onBlock.textMuted,
  },
});
