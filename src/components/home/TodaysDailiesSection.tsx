import { useEffect, useState } from 'react';
import { Text } from '../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
import { card, coloredCard, radius } from '../../theme/card';
import { pressable } from '../../theme/pressable';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { useIsRegularWidth } from '../../hooks/useIsRegularWidth';
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
/**
 * How much height a daily is given.
 *
 * A tablet gets the taller set. The open daily is the widest card on Home
 * there, and at phone height a card that wide reads as a banner across the
 * screen rather than the one thing the day is built around.
 */
interface DailyRowMetrics {
  expandedHeight: number;
  /**
   * One line of copy with room above and below it. Tight on purpose: a closed
   * daily is a label, and any more height reads as a card with nothing in it.
   */
  collapsedHeight: number;
  /** the copy block an open card spends its height on */
  contentHeight: number;
  /**
   * Oversized and bled off the corner so it reads as a watermark behind the
   * copy, matching the extra-practice shelf cards.
   */
  glyphSize: number;
}

const COMPACT_ROW_METRICS: DailyRowMetrics = {
  expandedHeight: 176,
  collapsedHeight: 58,
  contentHeight: 136,
  glyphSize: 150,
};

const REGULAR_ROW_METRICS: DailyRowMetrics = {
  expandedHeight: 248,
  collapsedHeight: 70,
  contentHeight: 208,
  glyphSize: 210,
};
/** how long a row takes to open, and the one it displaces to close */
const EXPAND_MS = 420;
/**
 * Every row runs this exact curve off the same prop change, so the one opening
 * and the one closing move together instead of racing.
 */
const EXPAND_TIMING = {
  duration: EXPAND_MS,
  easing: Easing.inOut(Easing.cubic),
} as const;
const TASK_GLYPH_RIGHT = -34;
const TASK_GLYPH_BOTTOM = -40;
const TASK_COPY_INSET = 72;
// Big enough to carry the row on its own: a closed daily is its mark, its name
// and the way in, so the mark is the size of an app tile rather than a bullet.
const COLLAPSED_GLYPH_SIZE = 34;
const TIMELINE_ROW_GAP = spacing.md;
const TIMELINE_RAIL_LEFT = TIMELINE_COLUMN_WIDTH / 2 - TIMELINE_RAIL_WIDTH / 2;
/**
 * A fixed count, spread by `space-between`. Deriving it from the rail's length
 * would change it mid-animation, and a dash appearing halfway through the open
 * is the one thing on this rail the eye is guaranteed to catch.
 */
const DASH_COUNT = 10;

/**
 * Where the rail starts and stops: the foot of the first marker to the top of
 * the last. Exactly one row is open at any time, so the section's total height
 * never changes and only these two insets move.
 */
function railGeometry(firstHeight: number, lastHeight: number) {
  return {
    top: firstHeight / 2 + TIMELINE_MARKER_SIZE / 2,
    bottom: lastHeight / 2 + TIMELINE_MARKER_SIZE / 2,
  };
}

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

/**
 * One daily is open at a time and the rest are closed to a single line, so the
 * section reads as a day with one thing in front of you rather than three
 * equally loud cards. Opening a row is a plain selection — the first tap opens
 * it, a second tap on the open row starts the session.
 */
interface DailyTaskRowProps {
  title: string;
  scheduledTime: string;
  techniqueMeta: string | null;
  detailLabel: string;
  detailIcon: BreathingTechnique['icon'];
  style: CategoryStyle;
  glyph: GlyphShape;
  metrics: DailyRowMetrics;
  expanded: boolean;
  completed: boolean;
  locked: boolean;
  loading?: boolean;
  /** open this row; the row that was open closes */
  onSelect: () => void;
  onPress?: () => void;
}

/** everything about a daily except which one happens to be open */
type DailyRowContent = Omit<
  DailyTaskRowProps,
  'expanded' | 'onSelect' | 'metrics'
>;

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
  metrics,
  expanded,
  completed,
  locked,
  loading = false,
  onSelect,
  onPress,
}: DailyTaskRowProps) {
  const unavailable = onPress == null;
  const statusLabel = completed ? 'completed' : locked ? 'locked' : 'not completed';
  const open = useSharedValue(expanded ? 1 : 0);
  const { collapsedHeight, expandedHeight } = metrics;

  useEffect(() => {
    open.value = withTiming(expanded ? 1 : 0, EXPAND_TIMING);
  }, [expanded, open]);

  // The row's height is the animation; both faces are mounted the whole time and
  // cross-fade across it. Swapping one for the other on a growing box is what
  // made the old version clip — the incoming face was already full height.
  const rowStyle = useAnimatedStyle(
    () => ({
      height: collapsedHeight + (expandedHeight - collapsedHeight) * open.value,
    }),
    [collapsedHeight, expandedHeight],
  );
  const openFace = useAnimatedStyle(() => ({ opacity: open.value }));
  const closedFace = useAnimatedStyle(() => ({ opacity: 1 - open.value }));

  return (
    <Animated.View style={rowStyle}>
      <Pressable
        onPress={() => {
          triggerTapHaptic();
          if (expanded) {
            onPress?.();
            return;
          }
          onSelect();
        }}
        disabled={expanded && unavailable}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${detailLabel}, scheduled for ${scheduledTime}${techniqueMeta == null ? '' : `, ${techniqueMeta}`}, ${statusLabel}`}
        accessibilityHint={expanded ? undefined : 'Opens this daily'}
        accessibilityState={{ expanded, disabled: expanded && unavailable }}
        style={({ pressed }) => [styles.taskRow, pressed && styles.taskPressed]}
      >
        <View style={styles.timelineColumn} pointerEvents="none">
          <View
            style={[
              styles.statusMarker,
              completed
                ? styles.statusMarkerCompleted
                : expanded
                  ? { backgroundColor: style.hue.base }
                  : styles.statusMarkerIdle,
            ]}
          >
            {completed ? (
              <Icon
                name="check"
                size={MARKER_ICON_SIZE}
                color={colors.text.inverse}
              />
            ) : null}
          </View>
        </View>

        <View style={styles.pillArea}>
          <Animated.View
            style={[StyleSheet.absoluteFill, closedFace]}
            pointerEvents="none"
          >
            <CollapsedTaskPill
              title={title}
              glyph={glyph}
              muted={completed}
            />
          </Animated.View>
          <Animated.View
            style={[StyleSheet.absoluteFill, openFace]}
            pointerEvents="none"
          >
            <ExpandedTaskPill
              title={title}
              scheduledTime={scheduledTime}
              techniqueMeta={techniqueMeta}
              detailLabel={detailLabel}
              detailIcon={detailIcon}
              style={style}
              glyph={glyph}
              metrics={metrics}
              loading={loading}
            />
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

type ExpandedTaskPillProps = Pick<
  DailyTaskRowProps,
  'title' | 'scheduledTime' | 'techniqueMeta' | 'detailLabel' | 'detailIcon' | 'style' | 'glyph' | 'metrics'
> & { loading: boolean };

function ExpandedTaskPill({
  title,
  scheduledTime,
  techniqueMeta,
  detailLabel,
  detailIcon,
  style,
  glyph,
  metrics,
  loading,
}: ExpandedTaskPillProps) {
  return (
    <View style={[styles.taskPillShadow, coloredCard(style.hue)]}>
      <View style={styles.taskPill}>
        <View
          style={[styles.taskGlyph, loading && styles.taskGlyphLoading]}
          pointerEvents="none"
        >
          <ActivityGlyph
            shape={glyph}
            size={metrics.glyphSize}
            color={colors.text.inverse}
            opacity={0.16}
          />
        </View>

        <View
          style={[styles.taskCopy, { height: metrics.contentHeight }]}
          pointerEvents="none"
        >
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
      </View>
    </View>
  );
}

interface CollapsedTaskPillProps {
  title: string;
  glyph: GlyphShape;
  muted: boolean;
}

function CollapsedTaskPill({
  title,
  glyph,
  muted,
}: CollapsedTaskPillProps) {
  return (
    <View style={styles.collapsedPill} pointerEvents="none">
      <View style={styles.collapsedLine}>
        {/* The daily's own shape, but always in the app's blue: a closed row is
            identifiable without spending the category colour, which is what
            tells you at a glance which card is open. */}
        <ActivityGlyph
          shape={glyph}
          size={COLLAPSED_GLYPH_SIZE}
          color={muted ? colors.text.tertiary : colors.primary.blue600}
        />
        {/* The title is the only part allowed to truncate — how long it takes
            is the reason to read a closed row at all. */}
        <Text
          style={[styles.collapsedTitle, muted && styles.collapsedContentMuted]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
    </View>
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
  const metrics = useIsRegularWidth()
    ? REGULAR_ROW_METRICS
    : COMPACT_ROW_METRICS;
  const guidedTitle = technique?.name ?? 'Your reset';
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
    : `${formatCategory(technique.category)} reset`;
  const guidedDetailIcon = technique?.icon ?? 'weather-windy';
  const rows: Record<DailyPlanActionId, DailyRowContent> = {
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
      title: 'The Azora Protocol',
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
  // Which row is open is the user's choice and is honoured whatever its state —
  // a finished daily opens like any other, so you can look at what you did or
  // run it again. With no choice made it falls back to the first unfinished
  // one, including a locked one, which opens the paywall.
  const [openedActionId, setOpenedActionId] = useState<DailyPlanActionId | null>(
    null,
  );
  const completionKey = orderedActionIds
    .map((actionId) => (rows[actionId].completed ? '1' : '0'))
    .join('');

  // Finishing anything drops the manual choice so the section re-aims at what
  // is left. Without this, completing the open row would leave it sitting there
  // as the one thing on offer.
  useEffect(() => {
    setOpenedActionId(null);
  }, [completionKey]);

  const expandedActionId =
    openedActionId ??
    orderedActionIds.find((actionId) => !rows[actionId].completed) ??
    orderedActionIds[orderedActionIds.length - 1];
  const rowHeight = (actionId: DailyPlanActionId) =>
    actionId === expandedActionId
      ? metrics.expandedHeight
      : metrics.collapsedHeight;
  const rail = railGeometry(
    rowHeight(orderedActionIds[0]),
    rowHeight(orderedActionIds[orderedActionIds.length - 1]),
  );
  const railTop = useSharedValue(rail.top);
  const railBottom = useSharedValue(rail.bottom);

  useEffect(() => {
    railTop.value = withTiming(rail.top, EXPAND_TIMING);
    railBottom.value = withTiming(rail.bottom, EXPAND_TIMING);
  }, [rail.top, rail.bottom, railTop, railBottom]);

  const railStyle = useAnimatedStyle(() => ({
    top: railTop.value,
    bottom: railBottom.value,
  }));

  return (
    <View style={styles.section}>
      <SectionHeader
        icon="calendar"
        title="Today’s Dailies"
        tone="inverse"
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
        <Animated.View
          style={[styles.timelineRail, railStyle]}
          pointerEvents="none"
        >
          {Array.from({ length: DASH_COUNT }, (_, dash) => (
            <View key={dash} style={styles.timelineRailDash} />
          ))}
        </Animated.View>
        {orderedActionIds.map((actionId) => (
          <DailyTaskRow
            key={actionId}
            {...rows[actionId]}
            metrics={metrics}
            expanded={actionId === expandedActionId}
            onSelect={() => setOpenedActionId(actionId)}
          />
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
    left: TIMELINE_RAIL_LEFT,
    width: TIMELINE_RAIL_WIDTH,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineRailDash: {
    width: TIMELINE_RAIL_WIDTH,
    height: 10,
    borderRadius: TIMELINE_RAIL_WIDTH / 2,
    backgroundColor: colors.neutral[0],
  },
  taskRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  // Both faces are stacked here and sized by the row, so neither one carries a
  // height of its own into the transition.
  pillArea: {
    flex: 1,
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
  // A closed row's marker is an empty ring; the open one fills with the daily's
  // own colour, so the rail says which row you are looking at. A closed marker
  // is a solid white dot like the dashes it sits on — the timeline lives on the
  // meadow, where a grey line reads as a smudge rather than a rail.
  statusMarkerIdle: {
    backgroundColor: colors.neutral[0],
  },
  statusMarkerCompleted: {
    backgroundColor: colors.success[500],
  },
  taskPillShadow: {
    ...card.blockShadow,
    flex: 1,
    borderRadius: radius.card,
  },
  taskPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
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
    justifyContent: 'space-between',
  },
  taskTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
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
    ...typography.title.title2,
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
    gap: spacing.sm,
  },
  metadataText: {
    ...typography.label.detail,
    fontSize: 14,
    lineHeight: 18,
    color: colors.onBlock.textMuted,
  },
  collapsedPill: {
    ...card.base,
    ...card.shadow,
    borderRadius: radius.medium,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  collapsedLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  // The one place a closed row breaks the SemiBold ceiling: the name is the
  // whole row now that the mark is the only other thing on it.
  collapsedTitle: {
    ...typography.body.medium,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    flex: 1,
  },
  collapsedContentMuted: {
    color: colors.text.tertiary,
  },
});
