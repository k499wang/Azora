import { useEffect, useState } from 'react';
import { Text } from '../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import ActivityGlyph from '../explore/ActivityGlyph';
import SectionHeader from '../common/SectionHeader';
import Overline from '../common/Overline';
import Icon, { type IconName } from '../common/icons/Icon';
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
  TODAY_JOURNEY_DASH_GAP,
  TODAY_JOURNEY_DASH_HEIGHT,
  TODAY_JOURNEY_RAIL_TIMING,
  todayJourneyDashCount,
} from './todayJourneyLayout';
import {
  formatDailyPlanTime,
  sortDailyPlanActionIdsByTime,
  type DailyPlanActionId,
} from '../../services/dailyPlan/dailyPlanScheduleCore';
import { DEFAULT_DAILY_PLAN_SCHEDULE } from '../../services/dailyPlan/types';
import {
  TODAY_JOURNEY_COLUMN_WIDTH,
  TODAY_JOURNEY_MARKER_ICON_SIZE,
  TODAY_JOURNEY_MARKER_SIZE,
  TODAY_JOURNEY_RAIL_WIDTH,
} from './todayJourneyLayout';

const TIMELINE_COLUMN_WIDTH = TODAY_JOURNEY_COLUMN_WIDTH;
const TIMELINE_MARKER_SIZE = TODAY_JOURNEY_MARKER_SIZE;
const MARKER_ICON_SIZE = TODAY_JOURNEY_MARKER_ICON_SIZE;
const TIMELINE_RAIL_WIDTH = TODAY_JOURNEY_RAIL_WIDTH;
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
/**
 * Every row runs this exact curve off the same prop change, so the one opening
 * and the one closing move together instead of racing.
 */
const EXPAND_TIMING = TODAY_JOURNEY_RAIL_TIMING;
const TASK_GLYPH_RIGHT = -34;
const TASK_GLYPH_BOTTOM = -40;
const TASK_COPY_INSET = 72;
// Big enough to carry the row on its own: a closed daily is its mark, its name
// and the way in, so the mark is the size of an app tile rather than a bullet.
const COLLAPSED_GLYPH_SIZE = 34;
const TIMELINE_ROW_GAP = spacing.md;
const TIMELINE_RAIL_LEFT = TIMELINE_COLUMN_WIDTH / 2 - TIMELINE_RAIL_WIDTH / 2;
/**
 * Enough dashes to overfill the rail at its tallest, laid at a fixed pitch and
 * clipped. The count never changes mid-animation and the pitch matches the goal
 * rail below, so the two read as one dotted line.
 */
const DASH_COUNT = todayJourneyDashCount(
  REGULAR_ROW_METRICS.expandedHeight + REGULAR_ROW_METRICS.collapsedHeight * 2,
);


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
  /** Everything on both of Home's lists is finished; the rail folds away. */
  dayDone?: boolean;
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
  detailIcon: IconName;
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
                : locked
                  ? styles.statusMarkerLocked
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
            ) : locked ? (
              <Icon
                name="lock"
                size={MARKER_ICON_SIZE - 2}
                color={colors.text.tertiary}
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
              <Icon
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
  dayDone = false,
}: TodaysDailiesSectionProps) {
  const guidedLocked = !guidedExerciseCompleted && !exerciseAccessAllowed;
  const handPickedLocked =
    !handPickedExerciseCompleted && !exerciseAccessAllowed;
  const breathHoldLocked = !breathHoldCompleted && !exerciseAccessAllowed;
  const metrics = useIsRegularWidth()
    ? REGULAR_ROW_METRICS
    : COMPACT_ROW_METRICS;
  const guidedDetailIcon = technique?.icon ?? 'wind';
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
  // Same line as the guided daily: what kind of reset it is, not the name of
  // the slot, which the title already carries.
  const handPickedDetail = handPickedTechnique == null
    ? 'Azora’s daily pick'
    : `${formatCategory(handPickedTechnique.category)} reset`;
  const handPickedDetailIcon = handPickedTechnique?.icon ?? 'sparkle';
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
      detailLabel: handPickedDetail,
      detailIcon: handPickedDetailIcon,
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
      detailIcon: 'timer',
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

      {dayDone ? null : (
        <>
          <Overline label="Exercises" style={styles.groupLabel} />

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
        </>
      )}
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
  // Flush with the section title above it. The section's own gap is sized for
  // blocks, so the label is pulled back down onto the rows it names.
  // Flush with the section header's icon, and given room above it so the label
  // reads as opening a group rather than as a caption on the header.
  groupLabel: {
    marginTop: spacing.sm,
    marginBottom: -spacing.md,
  },
  timeline: {
    position: 'relative',
    gap: TIMELINE_ROW_GAP,
  },
  // Dashes are anchored to the foot of the rail and overflow off the top,
  // where the section header hides the cut. Anchoring at the top instead would
  // leave the last dash at whatever phase the rail's height happened to end on,
  // and that phase is the gap the goal rail below has to start from.
  timelineRail: {
    position: 'absolute',
    left: TIMELINE_RAIL_LEFT,
    width: TIMELINE_RAIL_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  timelineRailDash: {
    width: TIMELINE_RAIL_WIDTH,
    height: TODAY_JOURNEY_DASH_HEIGHT,
    marginTop: TODAY_JOURNEY_DASH_GAP,
    borderRadius: TIMELINE_RAIL_WIDTH / 2,
    backgroundColor: colors.border.default,
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
  // A closed row's marker is an outlined white dot; the open one fills with the
  // daily's own colour, so the rail says which row you are looking at.
  statusMarkerIdle: {
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  // A daily the free plan has run out of keeps its place on the rail, but the
  // marker says why it will not open.
  statusMarkerLocked: {
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.default,
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
  // The name is the whole row now that the mark is the only other thing on it,
  // so it carries the row's weight.
  collapsedTitle: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  collapsedContentMuted: {
    color: colors.text.tertiary,
  },
});
