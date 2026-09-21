import { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import LockedScrim from '../../components/common/LockedScrim';
import Icon from '../../components/common/icons/Icon';
import { triggerTapHaptic } from '../../native/tapHaptics';
import type { IconName } from '../../components/common/icons/paths';
import {
  type PlanCalendar as Calendar,
  type PlanCalendarDay,
  type PlanCalendarWeek,
} from './domain/planCalendar';
import {
  openWeekOnArrival,
  toggledOpenWeek,
} from './domain/planOpenWeek';
import { planWeekPurpose } from './domain/planWeekPurpose';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/** Matches `TodoListSection`'s row gap: one spacing for stacked cards. */
const JOURNEY_ROW_GAP = 12;
const CELL_RADIUS = 10;
const ASK_ICON = 32;
const CHEVRON = 20;
const LOCKED_CTA_ICON = 32;

const COUNT_WORDS = ['No', 'One', 'Two', 'Three'] as const;

function countWord(count: number): string {
  return COUNT_WORDS[count] ?? String(count);
}

/**
 * What a day of this week asks for, said once for the week.
 *
 * Once per card rather than once per day: the check-in and the lesson are
 * every day of every week, and seven identical rows saying so is the screen
 * repeating itself six times over. The first line is the only one that
 * changes, and it changes twice in a plan.
 *
 * A week that grows mid-week says so. `pressure` adds its second on day ten,
 * inside week two, and calling that week "two a day" is the small lie that
 * stops a screen being worth reading.
 */
function weekAsks(
  week: PlanCalendarWeek,
): { icon: IconName; tint: string; label: string }[] {
  const { leastResets: least, mostResets: most } = week;
  // The hues Home gives these same three things, so a week reads as the days
  // the user already knows rather than as three blue lines.
  return [
    {
      icon: 'lotus',
      tint: colors.playful.teal.base,
      label:
        least === most
          ? `${countWord(least)} exercise${least === 1 ? '' : 's'} a day`
          : `${countWord(least)}, then ${countWord(most).toLowerCase()} exercises a day`,
    },
    {
      icon: 'face-calm',
      tint: colors.playful.blush.base,
      label: 'A check-in every day',
    },
    { icon: 'book', tint: colors.playful.sky.base, label: 'A lesson every day' },
  ];
}

/**
 * The whole plan, a card a week.
 *
 * It replaced three paragraphs. Three paragraphs are a claim that a plan
 * exists; this is the plan — every week it will ask for, every day inside it,
 * and how far along each week is.
 *
 * A week is its days and nothing else. Names, lengths and ticks were all tried
 * here and all of them made the same mistake: a screen for seeing where you
 * are became a screen to read. What is in a day belongs on Home, on the day.
 *
 * One card is open at a time. Pro starts on the week in play; free starts on
 * week one, the only week it can expand. It can still be closed. Two open
 * cards turn a glance at where the plan is into a scroll through its days, and
 * the one that matters most is the one the paragraph above is about.
 */
export default function PlanCalendar({
  calendar,
  isPro = true,
  onLockedWeekTap,
}: {
  calendar: Calendar;
  isPro?: boolean;
  onLockedWeekTap?: () => void;
}) {
  const [openWeek, setOpenWeek] = useState<number | null>(() =>
    isPro ? openWeekOnArrival(calendar.weeks) : 1,
  );

  useEffect(() => {
    // A subscription change can leave a later week open. Free users only get
    // week one, but `null` is the deliberate collapsed state for that card.
    if (!isPro && openWeek != null && openWeek !== 1) setOpenWeek(1);
  }, [isPro, openWeek]);

  /**
   * Which card is open belongs to the list, not to a card.
   *
   * Opening one and closing another are one decision, and this is where it is
   * made: a press names a week, and the card that was open hears about it in
   * the same commit, so the two moves are one layout transition rather than
   * two animations that have to be kept in step. `planOpenWeek` holds the rule
   * itself, where it can be tested.
   */
  const toggleWeek = useCallback((week: number) => {
    triggerTapHaptic();
    setOpenWeek((current) => toggledOpenWeek(current, week));
  }, []);

  return (
    <View style={styles.list}>
      {calendar.weeks.map((week) => (
        <WeekCard
          key={week.week}
          week={week}
          planId={calendar.planId}
          open={week.week === openWeek}
          onToggle={toggleWeek}
          isPro={isPro}
          onLockedWeekTap={onLockedWeekTap}
        />
      ))}
    </View>
  );
}

const WeekCard = memo(function WeekCard({
  week,
  planId,
  open,
  onToggle,
  isPro = true,
  onLockedWeekTap,
}: {
  week: PlanCalendarWeek;
  planId: Calendar['planId'];
  open: boolean;
  onToggle: (week: number) => void;
  isPro?: boolean;
  onLockedWeekTap?: () => void;
}) {
  const current = week.state === 'today';
  const isLocked = !isPro && week.week >= 2;
  const isExpanded = open && !isLocked;

  /**
   * The body is measured once and never again.
   *
   * `latched` is what stops a second measurement landing mid-animation: the
   * body sits in normal flow inside a clip whose height is moving, so React
   * Native re-runs layout on it as the clip shrinks and hands back the clipped
   * height. Multiplying that against a falling progress is what made the card
   * drop away faster the further it got. The first measurement is the natural
   * height, and the only one worth having.
   */
  const bodyHeight = useSharedValue(0);
  const latched = useSharedValue(false);
  const progress = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isExpanded ? 1 : 0, {
      duration: duration.base,
      easing: easing.enter,
    });
  }, [isExpanded, progress]);

  const handlePress = useCallback(() => {
    triggerTapHaptic();
    if (isLocked) {
      onLockedWeekTap?.();
      return;
    }
    onToggle(week.week);
  }, [isLocked, onLockedWeekTap, onToggle, week.week]);

  const measure = useCallback(
    (event: LayoutChangeEvent) => {
      if (latched.value) return;
      latched.value = true;
      bodyHeight.value = event.nativeEvent.layout.height;
    },
    [bodyHeight, latched],
  );

  const bodyStyle = useAnimatedStyle(() => ({
    height: bodyHeight.value * progress.value,
  }));

  const bodyContentStyle = useAnimatedStyle(() => ({
    opacity: latched.value ? Math.min(1, progress.value * 1.6) : 0,
    transform: [{ translateY: (progress.value - 1) * bodyHeight.value }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  return (
    <View style={[card.base, card.shadow, styles.weekCard]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`Week ${week.week}, ${week.phaseName}${isLocked ? ', locked' : ''}`}
        onPress={handlePress}
        pointerEvents={isLocked ? 'none' : 'auto'}
        accessibilityElementsHidden={isLocked}
        importantForAccessibility={isLocked ? 'no-hide-descendants' : 'auto'}
        style={styles.header}
      >
        <View style={styles.heading}>
          <Text style={styles.span}>
            {week.span} · {week.phaseName}
          </Text>
          <Text
            style={[
              styles.weekTitle,
              current && styles.weekTitleCurrent,
              week.state === 'done' && styles.weekTitleDone,
              isLocked && styles.weekTitleLocked,
            ]}
          >
            Week {week.week}
          </Text>
        </View>
        {/* Turned rather than swapped, so it moves with the card instead of
            becoming a different glyph part-way through. */}
        {isLocked ? (
          <Icon name="lock" size={CHEVRON} color={colors.text.tertiary} />
        ) : (
          <Animated.View style={chevronStyle}>
            <Icon name="chevron-down" size={CHEVRON} color={colors.text.tertiary} />
          </Animated.View>
        )}
      </Pressable>

      {isLocked ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.lockedPreview}
        >
          <WeekBody week={week} planId={planId} />
        </View>
      ) : (
        /* Always mounted. Seven day cells and three SVG icons built on the frame
            the animation starts is a dropped frame at exactly the wrong moment,
            so the body is constructed once and only ever clipped. */
        <Animated.View
          style={[styles.clip, bodyStyle]}
          pointerEvents={isExpanded ? 'auto' : 'none'}
          accessibilityElementsHidden={!isExpanded}
          importantForAccessibility={isExpanded ? 'auto' : 'no-hide-descendants'}
        >
          {/* Absolutely positioned, which is what keeps the cost of a frame
              constant. Laid out in flow, changing the clip's height re-runs
              layout for everything inside it — seven day cells and three SVG
              icons — on every frame of the animation. Out of flow, the body is
              laid out once against the card's width and the clip's height means
              nothing to it. */}
          <Animated.View style={[styles.bodyMeasure, bodyContentStyle]} onLayout={measure}>
            <WeekBody week={week} planId={planId} />
          </Animated.View>
        </Animated.View>
      )}

      {isLocked ? (
        <>
          <LockedScrim intensity={65} />
          <View pointerEvents="none" style={styles.lockedHeaderOverlay}>
            <View style={styles.heading}>
              <Text style={styles.span}>
                {week.span} · {week.phaseName}
              </Text>
              <Text style={[styles.weekTitle, styles.weekTitleLocked]}>
                Week {week.week}
              </Text>
            </View>
            <Icon name="lock" size={CHEVRON} color={colors.text.tertiary} />
          </View>
          <View pointerEvents="none" style={styles.lockedOverlay}>
            <Icon name="lock" size={LOCKED_CTA_ICON} color={colors.text.secondary} />
            <Text style={styles.lockedMessage}>
              Subscribe to Azora Pro to unlock the rest of your plan.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Subscribe to Azora Pro to unlock Week ${week.week} and the rest of your plan`}
            onPress={handlePress}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : null}
    </View>
  );
});

/**
 * Everything a week says past its title.
 *
 * Memoised, and it takes the week rather than the open flag, so opening or
 * closing the card cannot re-render any of it. Toggling is a change to one
 * number on the UI thread and nothing else.
 */
const WeekBody = memo(function WeekBody({
  week,
  planId,
}: {
  week: PlanCalendarWeek;
  planId: Calendar['planId'];
}) {
  const purpose = planWeekPurpose(planId, week.week);

  return (
    <View style={styles.body}>
      <View style={styles.days}>
        {week.days.map((day) => (
          <DayCell key={day.day} day={day} />
        ))}
      </View>

      {/* Runna's rows, without the boxes: this is what the week holds, not a
          list of things to tick. The days above are the ticking. */}
      <View style={styles.asks}>
        {weekAsks(week).map((ask) => (
          <View key={ask.icon} style={styles.ask}>
            <Icon name={ask.icon} size={ASK_ICON} color={ask.tint} />
            <Text style={styles.askLabel}>{ask.label}</Text>
          </View>
        ))}
      </View>

      {/* What the three lines above are in aid of. Last, because it is the
          reason for the week rather than a heading over it. */}
      {purpose == null ? null : (
        <Text style={styles.purpose}>{purpose}</Text>
      )}
    </View>
  );
});

/**
 * One day, as a number.
 *
 * Filled for the days behind them, outlined for the day on offer, plain for
 * the rest. No tick: the fill already says it, and a tick in a row of seven
 * turns a week into something to audit rather than something to glance at.
 */
function DayCell({ day }: { day: PlanCalendarDay }) {
  const done = day.state === 'done';
  const today = day.state === 'today';

  return (
    <View
      accessibilityLabel={`Day ${day.day}, ${
        done ? 'done' : today ? 'today' : 'to come'
      }`}
      style={[styles.cell, done && styles.cellDone, today && styles.cellToday]}
    >
      <Text
        style={[
          styles.dayNumber,
          done && styles.dayNumberDone,
          today && styles.dayNumberToday,
        ]}
      >
        {day.day}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // The gap Home's list of cards sits at, so a stack of cards reads the same
  // wherever it appears.
  list: {
    gap: JOURNEY_ROW_GAP,
  },
  weekCard: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heading: {
    flexShrink: 1,
    // The day range sits close under the week title rather than touching it.
    gap: spacing.xs,
  },
  /** Holds the animated height; the body inside keeps its natural one. */
  clip: {
    overflow: 'hidden',
  },
  bodyMeasure: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  body: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  span: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  weekTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  /**
   * The week in play, marked by its own title rather than by a border.
   *
   * A ring around the card competes with the card's own edge and turns a list
   * of weeks into a list of boxes.
   */
  weekTitleCurrent: {
    color: colors.playful.sky.base,
  },
  /** Behind them: the title stands back, the card itself does not fade. */
  weekTitleDone: {
    color: colors.text.tertiary,
  },
  /** Locked weeks: muted title for free users. */
  weekTitleLocked: {
    color: colors.text.tertiary,
  },
  lockedMessage: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  lockedPreview: {
    marginTop: spacing.sm,
  },
  lockedHeaderOverlay: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  days: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  asks: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  ask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  purpose: {
    ...typography.body.small,
    color: colors.text.secondary,
    paddingTop: spacing.md,
  },
  askLabel: {
    ...typography.body.medium,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: CELL_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  // The same marks the profile calendar makes: a filled day, and a ring on
  // the one in play.
  cellDone: {
    backgroundColor: colors.playful.sky.base,
  },
  cellToday: {
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.playful.sky.ink,
  },
  dayNumber: {
    ...typography.label.large,
    color: colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  dayNumberDone: {
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  dayNumberToday: {
    fontFamily: fonts.semibold,
    color: colors.playful.sky.ink,
  },
});
