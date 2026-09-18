import { memo, useCallback, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import type { IconName } from '../../components/common/icons/paths';
import ProgressBar from '../../components/common/ProgressBar';
import {
  planCalendarRemaining,
  type PlanCalendar as Calendar,
  type PlanCalendarDay,
  type PlanCalendarWeek,
} from './domain/planCalendar';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const CELL_RADIUS = 10;
const BAR_HEIGHT = 6;
const ASK_ICON = 22;
const CHEVRON = 20;
/** Long enough to read as the card growing, short enough not to be a wait. */
const EXPAND_MS = 200;
const EXPAND_EASING = Easing.out(Easing.cubic);

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
function weekAsks(week: PlanCalendarWeek): { icon: IconName; label: string }[] {
  const { leastResets: least, mostResets: most } = week;
  return [
    {
      icon: 'lotus',
      label:
        least === most
          ? `${countWord(least)} exercise${least === 1 ? '' : 's'} a day`
          : `${countWord(least)}, then ${countWord(most).toLowerCase()} exercises a day`,
    },
    { icon: 'face-calm', label: 'A check-in every day' },
    { icon: 'book', label: 'A lesson every day' },
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
 */
export default function PlanCalendar({ calendar }: { calendar: Calendar }) {
  return (
    <View style={styles.list}>
      {calendar.weeks.map((week) => (
        <WeekCard key={week.week} week={week} />
      ))}
      <Text style={styles.remaining}>{planCalendarRemaining(calendar)}</Text>
    </View>
  );
}

function WeekCard({ week }: { week: PlanCalendarWeek }) {
  const current = week.state === 'today';
  const [open, setOpen] = useState(current);

  /**
   * The body's natural height, kept in a shared value rather than in state.
   *
   * Measuring into `useState` re-renders the card, and re-rendering while a
   * height is animating is what made this stutter: the work lands on the JS
   * thread on the same frames the animation is asking for. Here the measure
   * writes straight to the UI thread and React never hears about it.
   */
  const bodyHeight = useSharedValue(0);
  const progress = useSharedValue(current ? 1 : 0);

  const toggle = useCallback(() => {
    setOpen((value) => {
      progress.value = withTiming(value ? 0 : 1, {
        duration: EXPAND_MS,
        easing: EXPAND_EASING,
      });
      return !value;
    });
  }, [progress]);

  const measure = useCallback(
    (event: LayoutChangeEvent) => {
      bodyHeight.value = event.nativeEvent.layout.height;
    },
    [bodyHeight],
  );

  const bodyStyle = useAnimatedStyle(() => ({
    height: bodyHeight.value * progress.value,
    // Fades a touch faster than it closes, so the last few points of travel
    // are empty space rather than clipped text.
    opacity: Math.min(1, progress.value * 1.6),
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  return (
    <View
      style={[
        card.base,
        card.shadow,
        styles.weekCard,
        week.state === 'done' && styles.weekDone,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Week ${week.week}, ${week.phaseName}`}
        onPress={toggle}
        style={styles.header}
      >
        <View style={styles.heading}>
          <Text style={styles.span}>
            {week.span} · {week.phaseName}
          </Text>
          <Text style={[styles.weekTitle, current && styles.weekTitleCurrent]}>
            Week {week.week}
          </Text>
        </View>
        {/* Turned rather than swapped, so it moves with the card instead of
            becoming a different glyph part-way through. */}
        <Animated.View style={chevronStyle}>
          <Icon name="chevron-down" size={CHEVRON} color={colors.text.tertiary} />
        </Animated.View>
      </Pressable>

      <Animated.View
        style={[styles.clip, bodyStyle]}
        pointerEvents={open ? 'auto' : 'none'}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      >
        <WeekBody week={week} onLayout={measure} />
      </Animated.View>
    </View>
  );
}

/**
 * Everything a week says past its title.
 *
 * Memoised, and it takes the week rather than the open flag, so opening or
 * closing the card cannot re-render any of it. Toggling is a change to one
 * number on the UI thread and nothing else.
 */
const WeekBody = memo(function WeekBody({
  week,
  onLayout,
}: {
  week: PlanCalendarWeek;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  const total = week.days.length;

  return (
    <View style={styles.body} onLayout={onLayout}>
      <ProgressBar
        progress={total === 0 ? 0 : week.daysDone / total}
        height={BAR_HEIGHT}
      />
      <Text style={styles.count}>
        Days: {week.daysDone}/{total}
      </Text>

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
            <Icon name={ask.icon} size={ASK_ICON} color={colors.primary.blue500} />
            <Text style={styles.askLabel}>{ask.label}</Text>
          </View>
        ))}
      </View>
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
  list: {
    gap: spacing.md,
  },
  weekCard: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heading: {
    flexShrink: 1,
  },
  /** Holds the animated height; the body inside keeps its natural one. */
  clip: {
    overflow: 'hidden',
  },
  body: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  /** Behind them, and standing back without becoming unreadable. */
  weekDone: {
    opacity: 0.7,
  },
  span: {
    ...typography.label.detail,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  weekTitle: {
    ...typography.title.title2,
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
    color: colors.primary.blue500,
  },
  count: {
    ...typography.body.small,
    color: colors.text.tertiary,
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
  askLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
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
  cellDone: {
    backgroundColor: colors.primary.blue500,
  },
  cellToday: {
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.primary.blue500,
  },
  dayNumber: {
    ...typography.label.detail,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  dayNumberDone: {
    color: colors.text.inverse,
  },
  dayNumberToday: {
    color: colors.primary.blue500,
  },
  remaining: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
