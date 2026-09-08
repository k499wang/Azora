import { useEffect, useMemo, useState } from 'react';
import { Text } from '../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import ActivityGlyph from '../explore/ActivityGlyph';
import SectionHeader from '../common/SectionHeader';
import Overline from '../common/Overline';
import Icon from '../common/icons/Icon';
import type { BreathingTechnique } from '../../features/exercise/guidedBreathing/techniques';
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
import { fonts, typography, wrappedLineHeight } from '../../theme/typography';
import {
  TODAY_JOURNEY_CARD_MIN_HEIGHT,
  TODAY_JOURNEY_LABEL_GAP,
  TODAY_JOURNEY_RAIL_TIMING,
} from './todayJourneyLayout';
import {
  formatDailyPlanTime,
  resolveDailyPlanOrder,
  sanitizeDailyPlanOrder,
  type DailyPlanActionId,
} from '../../services/dailyPlan/dailyPlanScheduleCore';
import {
  dailyPlanOrderNow,
  loadDailyPlanOrder,
  saveDailyPlanOrder,
} from '../../services/preferences/dailyPlanOrder';
import {
  DEFAULT_DAILY_PLAN_SCHEDULE,
  type DailyPlanSchedule,
} from '../../services/dailyPlan/types';
import JourneyDragRow from './journey/JourneyDragRow';
import {
  journeyReorderActions,
  useJourneyReorder,
  type JourneyScrollRef,
} from './journey/useJourneyReorder';

/**
 * How much height a daily is given.
 *
 * A tablet gets a little more breathing room without changing the card's
 * content or interaction model.
 */
const DAILY_GLYPH_SIZE = 38;
const ROW_SETTLE_TIMING = TODAY_JOURNEY_RAIL_TIMING;
const TIMELINE_ROW_GAP = 12;
/** How far the group label sits below the section heading. */
const LABEL_TOP_GAP = 30;

interface TodaysDailiesSectionProps {
  technique: BreathingTechnique | null;
  techniqueLoading: boolean;
  handPickedTechnique: BreathingTechnique | null;
  handPickedTechniqueLoading: boolean;

  /**
   * The hours the three dailies happen at, and the order they are read in when
   * the user has not arranged one of their own.
   *
   * Dragging a daily does not touch this. The hours are what the reminders fire
   * on and what each card says; the order they are shown in is a preference
   * about this screen, kept on the device.
   */
  schedule: DailyPlanSchedule;
  guidedExerciseCompleted: boolean;
  handPickedExerciseCompleted: boolean;
  breathHoldCompleted: boolean;
  exerciseAccessAllowed: boolean;
  onPressGuidedExercise: () => void;
  onPressHandPickedExercise: () => void;
  onPressBreathHold: () => void;
  onPressHistory: () => void;
  /** The page the section sits on; the drag makes it wait rather than scroll. */
  scrollRef: JourneyScrollRef;
  /** Everything on both of Home's lists is finished; the rows fold away. */
  dayDone?: boolean;
}

/** A fixed exercise card with an explicit start action. */
interface DailyTaskRowProps {
  title: string;
  scheduledTime: string;
  detailLabel: string;
  style: CategoryStyle;
  glyph: GlyphShape;
  completed: boolean;
  locked: boolean;
  loading?: boolean;
  onPress?: () => void;
  /** whether a row is being dragged, so a release on this one is not a tap */
  isArranging: () => boolean;
  /** the same reorder the drag does, one place at a time, for VoiceOver */
  onMove: (delta: number) => void;
}

/** everything about a daily except which one happens to be open */
type DailyRowContent = Omit<
  DailyTaskRowProps,
  'isArranging' | 'onMove'
>;

const EXERCISE_TITLES: Record<BreathingTechnique['category'], string> = {
  calm: 'Take a calming reset',
  focus: 'Do a focus reset',
  energy: 'Try an energizing reset',
  sleep: 'Do a sleep exercise before bed',
  balance: 'Do a mindful breathing exercise',
};

function resolveExerciseTitle(technique: BreathingTechnique | null): string {
  return technique == null
    ? 'Do your daily reset'
    : EXERCISE_TITLES[technique.category];
}

function DailyTaskRow({
  title,
  scheduledTime,
  detailLabel,
  style,
  glyph,
  completed,
  locked,
  loading = false,
  isArranging,
  onPress,
  onMove,
}: DailyTaskRowProps) {
  const unavailable = onPress == null;
  const disabled = unavailable || loading;
  const statusLabel = completed ? 'completed' : locked ? 'locked' : 'not completed';

  return (
    <View
      style={styles.taskRow}
      {...journeyReorderActions(onMove)}
    >
      <View style={[card.base, card.shadow, styles.taskCard]}>
        <ActivityGlyph
          shape={glyph}
          size={DAILY_GLYPH_SIZE}
          color={completed ? colors.text.tertiary : style.hue.base}
        />
        <View style={styles.taskCopy}>
          <View style={styles.taskHeading}>
            <Text style={styles.taskType} numberOfLines={1}>
              {detailLabel}
            </Text>
            <Text
              style={[styles.taskTitle, completed && styles.taskContentMuted]}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
          <View style={styles.metadataRow}>
            <Icon name="clock" size={14} color={colors.text.tertiary} />
            <Text style={styles.metadataText}>{scheduledTime}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Start ${title}`}
          accessibilityHint={`${statusLabel}. Hold the card to rearrange your dailies.`}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => {
            if (isArranging()) return;
            triggerTapHaptic();
            onPress?.();
          }}
          style={({ pressed }) => [
            styles.startButton,
            disabled && pressable.disabled,
            pressed && pressable.control,
          ]}
        >
          <Icon
            name="play-triangle"
            size={20}
            color={completed ? colors.text.tertiary : colors.primary.blue600}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function TodaysDailiesSection({
  technique,
  techniqueLoading,
  handPickedTechnique,
  handPickedTechniqueLoading,
  schedule,
  guidedExerciseCompleted,
  handPickedExerciseCompleted,
  breathHoldCompleted,
  exerciseAccessAllowed,
  onPressGuidedExercise,
  onPressHandPickedExercise,
  onPressBreathHold,
  onPressHistory,
  scrollRef,
  dayDone = false,
}: TodaysDailiesSectionProps) {
  const guidedLocked = !guidedExerciseCompleted && !exerciseAccessAllowed;
  const handPickedLocked =
    !handPickedExerciseCompleted && !exerciseAccessAllowed;
  const breathHoldLocked = !breathHoldCompleted && !exerciseAccessAllowed;
  const guidedTitle = resolveExerciseTitle(technique);
  const guidedScheduledTime = formatDailyPlanTime(
    schedule.actions.session,
    DEFAULT_DAILY_PLAN_SCHEDULE.actions.session,
  );
  const breathHoldScheduledTime = formatDailyPlanTime(
    schedule.actions.checkIn,
    DEFAULT_DAILY_PLAN_SCHEDULE.actions.checkIn,
  );
  const handPickedScheduledTime = formatDailyPlanTime(
    schedule.actions.handPicked,
    DEFAULT_DAILY_PLAN_SCHEDULE.actions.handPicked,
  );
  /**
   * The order the user arranged, read once on the way in and written straight
   * through on every drop. Null until they arrange one, and then the day's own
   * order stands.
   */
  const [arrangedOrder, setArrangedOrder] = useState(dailyPlanOrderNow);

  // Already primed on all but the very first read of the app's life, so this
  // usually settles on the same order the first render drew with.
  useEffect(() => {
    let live = true;
    void loadDailyPlanOrder().then((stored) => {
      if (live) setArrangedOrder(stored);
    });
    return () => {
      live = false;
    };
  }, []);
  const guidedDetail = technique?.name ?? 'Personalized for you';
  const handPickedTitle = resolveExerciseTitle(handPickedTechnique);
  const handPickedDetail = handPickedTechnique?.name ?? 'Azora’s daily pick';
  const rows: Record<DailyPlanActionId, DailyRowContent> = {
    session: {
      title: guidedTitle,
      scheduledTime: guidedScheduledTime,
      detailLabel: guidedDetail,
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
      title: handPickedTitle,
      scheduledTime: handPickedScheduledTime,
      detailLabel: handPickedDetail,
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
      title: 'Complete your daily check-in',
      scheduledTime: breathHoldScheduledTime,
      detailLabel: 'The Azora Protocol',
      style: BREATH_HOLD_STYLE,
      glyph: BREATH_HOLD_STYLE.glyph,
      completed: breathHoldCompleted,
      locked: breathHoldLocked,
      onPress: onPressBreathHold,
    },
  };
  const orderedActionIds = useMemo(
    () => resolveDailyPlanOrder(arrangedOrder, schedule.actions),
    [arrangedOrder, schedule.actions],
  );
  const completedCount = orderedActionIds.filter(
    (actionId) => rows[actionId].completed,
  ).length;
  const { controller, moveBy, restoreOrder } = useJourneyReorder({
    ids: orderedActionIds,
    gap: TIMELINE_ROW_GAP,
    enabled: !dayDone,
    // The three dailies' heights are design constants, so this list can stand
    // its rows up by transform alone and never re-lay them out — which is what
    // keeps a drop from painting one frame of the new slot with the dragged
    // row's old offset still on it.
    positioned: true,
    restingTiming: ROW_SETTLE_TIMING,
    onReorder: (ids) => {
      // Refused only if the list is somehow no longer the three dailies, in
      // which case the rows go back where they were rather than standing in an
      // order nothing else agrees with.
      const next = sanitizeDailyPlanOrder(ids);
      if (next == null) {
        restoreOrder();
        return;
      }
      setArrangedOrder(next);
      void saveDailyPlanOrder(next);
    },
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

      {dayDone ? null : (
        <>
          <Overline
            label="Exercises"
            done={completedCount}
            total={orderedActionIds.length}
            style={styles.groupLabel}
          />

          <View
            style={[
              styles.timeline,
              // Told, because the rows no longer tell it: they all stand at the
              // top of this box and are moved down into place.
              { height: controller.contentHeight ?? undefined },
            ]}
          >
            {orderedActionIds.map((actionId, index) => (
              <JourneyDragRow
                key={actionId}
                controller={controller}
                id={actionId}
                index={index}
                scrollRef={scrollRef}
              >
                <DailyTaskRow
                  {...rows[actionId]}
                  isArranging={controller.isArranging}
                  onMove={(delta) => moveBy(actionId, delta)}
                />
              </JourneyDragRow>
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
  groupLabel: {
    marginTop: LABEL_TOP_GAP - spacing.lg,
    marginBottom: TODAY_JOURNEY_LABEL_GAP - spacing.lg,
  },
  timeline: {
    position: 'relative',
    gap: TIMELINE_ROW_GAP,
  },
  taskRow: {
    flex: 1,
    minHeight: TODAY_JOURNEY_CARD_MIN_HEIGHT,
  },
  taskCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.medium,
  },
  taskCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  taskHeading: {
    gap: 6,
  },
  taskType: {
    ...typography.overline,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  taskTitle: {
    ...typography.body.large,
    lineHeight: wrappedLineHeight(typography.body.large.fontSize),
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metadataText: {
    ...typography.label.detail,
    color: colors.text.tertiary,
  },
  taskContentMuted: {
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  startButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.small,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: colors.border.default,
  },
});
