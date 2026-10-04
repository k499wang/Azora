import { memo, useCallback, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts, typography, wrappedLineHeight } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { completedGoalsSummary, type SelfCareGoal } from './domain/selfCareGoal';
import { useWhileVisible } from '../../hooks/useWhileVisible';

const SUMMARY_HEIGHT = 46;
const SUMMARY_CHECK_SIZE = 28;
const ROW_HEIGHT = 44;
const ROW_BADGE_SIZE = 32;
const ROW_LINE_HEIGHT = wrappedLineHeight(typography.body.medium.fontSize);
const ROW_TITLE_MAX_LINES = 3;
// Paced by how far the drawer travels, so two rows and twenty both read as the
// same gesture rather than a short list crawling or a long one flung open.
const OPEN_MIN_MS = duration.base;
const OPEN_MAX_MS = duration.slow;
const OPEN_MS_PER_POINT = 0.3;
/** closing is the drawer going away: quicker than opening, never abrupt */
const CLOSE_SCALE = 0.8;
/** arrives fast and settles without a long crawl at the end */
const OPEN_EASING = easing.enter;
/** the standard ease: a gentle start so the rows are seen to go */
const CLOSE_EASING = Easing.bezier(0.4, 0, 0.2, 1);
/** how much of the open each row's own entrance takes */
const ROW_SHARE = 0.55;
/** how far a row drops in from as it appears */
const ROW_DROP = 8;
const RESIZE_TIMING = { duration: duration.base, easing: easing.enter } as const;

interface Props {
  goals: SelfCareGoal[];
  onOpenGoal: (goalId: string) => void;
  /** fades in when habits are filed into it; not when the page first draws */
  animateEntrance: boolean;
}

interface RowProps {
  goal: SelfCareGoal;
  index: number;
  count: number;
  progress: SharedValue<number>;
  onOpenGoal: (goalId: string) => void;
}

/**
 * The finished habits, folded behind a summary row.
 *
 * Its own component with its own open state, so opening it re-renders this
 * drawer and nothing else on the page. Everything that moves reads one shared
 * progress on the UI thread: the box unrolls from under the summary, the
 * chevron turns, and the rows drop in one after another as the edge reaches
 * them — and lift out bottom first on the way back.
 *
 * The rows are mounted on the press-in, ahead of the tap landing, so a first
 * open is not also the frame that builds a dozen icons.
 */
/**
 * Re-rendered only when what it draws changes. The list hands it a new array on
 * every one of its renders — several per tick — holding the same habits.
 */
function drawerPropsEqual(previous: Props, next: Props): boolean {
  if (
    previous.onOpenGoal !== next.onOpenGoal ||
    previous.animateEntrance !== next.animateEntrance ||
    previous.goals.length !== next.goals.length
  ) {
    return false;
  }
  return previous.goals.every((goal, index) => {
    const other = next.goals[index];
    return (
      goal.id === other.id && goal.title === other.title && goal.icon === other.icon
    );
  });
}

export default memo(CompletedGoalsDrawer, drawerPropsEqual);

function CompletedGoalsDrawer({
  goals,
  onOpenGoal,
  animateEntrance,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const progress = useSharedValue(0);
  const height = useSharedValue(0);
  const measured = useRef(0);
  const openRef = useRef(false);
  const unmountClosedRows = useCallback(() => {
    if (!openRef.current) {
      measured.current = 0;
      setMounted(false);
    }
  }, []);

  useWhileVisible(() => () => {
    cancelAnimation(progress);
    cancelAnimation(height);
    openRef.current = false;
    progress.value = 0;
    setOpen(false);
    unmountClosedRows();
  }, [progress, height, unmountClosedRows]);

  const animateTo = useCallback(
    (next: boolean) => {
      const target = next ? 1 : 0;
      if (reducedMotion) {
        progress.value = target;
        if (!next) unmountClosedRows();
        return;
      }
      // Not laid out yet: there is nothing to unroll to, and the layout that
      // measures the rows starts the open instead.
      if (measured.current === 0) {
        if (!next) {
          progress.value = 0;
          unmountClosedRows();
        }
        return;
      }
      const openMs = Math.min(
        OPEN_MAX_MS,
        Math.max(OPEN_MIN_MS, measured.current * OPEN_MS_PER_POINT),
      );
      progress.value = withTiming(
        target,
        next
          ? { duration: openMs, easing: OPEN_EASING }
          : { duration: openMs * CLOSE_SCALE, easing: CLOSE_EASING },
        (finished) => {
          if (finished && !next) runOnJS(unmountClosedRows)();
        },
      );
    },
    [progress, reducedMotion, unmountClosedRows],
  );

  const toggle = () => {
    triggerTapHaptic();
    const next = !openRef.current;
    openRef.current = next;
    setMounted(true);
    setOpen(next);
    animateTo(next);
  };

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const next = event.nativeEvent.layout.height;
      if (next === measured.current) return;
      const first = measured.current === 0;
      measured.current = next;
      if (first) {
        height.value = next;
        if (openRef.current) animateTo(true);
        return;
      }
      // A habit filed in, or one taken back out, while the drawer is open
      // grows or shrinks it on a curve rather than in a jump.
      height.value =
        openRef.current && !reducedMotion
          ? withTiming(next, RESIZE_TIMING)
          : next;
    },
    [height, animateTo, reducedMotion],
  );

  const boxStyle = useAnimatedStyle(() => ({
    height: height.value * progress.value,
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(progress.value - 1) * 90}deg` }],
  }));

  const summary = completedGoalsSummary(goals.length);

  // The entrance and the list's fade are on separate views: a layout animation
  // and an animated style both writing opacity to one view fight over it, and
  // the entrance flickers or never shows.
  return (
    <Animated.View
      entering={animateEntrance ? FadeIn.duration(duration.slow) : undefined}
    >
      <View style={styles.drawer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={summary}
          onPressIn={() => setMounted(true)}
          onPress={toggle}
          style={({ pressed }) => [styles.summary, pressed && pressable.surface]}
        >
          <View style={styles.summaryCheck}>
            <Icon bold name="check" size={16} color={colors.text.secondary} />
          </View>
          <Text style={styles.summaryLabel}>{summary}</Text>
          <Animated.View style={chevronStyle}>
            <Icon bold name="chevron-down" size={18} color={colors.text.secondary} />
          </Animated.View>
        </Pressable>
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          accessibilityElementsHidden={!open}
          importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
          style={[styles.box, boxStyle]}
        >
          {/* Out of flow, so it is measured at its natural height whatever the
              box is currently clipped to. */}
          {mounted ? (
            <View style={styles.list} onLayout={onLayout}>
              {goals.map((goal, index) => (
                <CompletedGoalRow
                  key={goal.id}
                  goal={goal}
                  index={index}
                  count={goals.length}
                  progress={progress}
                  onOpenGoal={onOpenGoal}
                />
              ))}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function CompletedGoalRow({ goal, index, count, progress, onOpenGoal }: RowProps) {
  // Each row takes its turn across the open, in list order: the top one as
  // the drawer starts to unroll, the last as it lands.
  const start = count <= 1 ? 0 : (index / (count - 1)) * (1 - ROW_SHARE);
  const animatedStyle = useAnimatedStyle(() => {
    const own = Math.min(Math.max((progress.value - start) / ROW_SHARE, 0), 1);
    return {
      opacity: own,
      transform: [{ translateY: (own - 1) * ROW_DROP }],
    };
  }, [start]);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${goal.title}, completed`}
        accessibilityHint="Opens this habit"
        onPress={() => {
          triggerTapHaptic();
          onOpenGoal(goal.id);
        }}
        style={({ pressed }) => [styles.row, pressed && pressable.subtle]}
      >
        <View style={styles.rowBadge}>
          <TaskIllustration name={goal.icon} size={28} done />
        </View>
        <Text style={styles.rowTitle} numberOfLines={ROW_TITLE_MAX_LINES}>
          {goal.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // The scrim wraps the summary and everything it opens, so the list reads as
  // the inside of the row you pressed rather than as cards below it.
  // A tighter radius than the add row: at this row's height the card radius
  // curves through most of the edge and the scrim reads as a pill.
  drawer: {
    borderRadius: radius.medium,
    backgroundColor: colors.inertRow.fill,
    overflow: 'hidden',
  },
  // Shorter than a to-do row: the summary is a lid, not another item on the
  // list, so the scrim it draws sits tighter than the cards above it.
  summary: {
    height: SUMMARY_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  // The same cream square as the add-goal plus, so the two rows that bookend
  // the list carry the same mark.
  summaryCheck: {
    width: SUMMARY_CHECK_SIZE,
    height: SUMMARY_CHECK_SIZE,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.canvas,
  },
  summaryLabel: {
    flex: 1,
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  box: {
    overflow: 'hidden',
  },
  list: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.sm,
  },
  row: {
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowBadge: {
    width: ROW_BADGE_SIZE,
    height: ROW_BADGE_SIZE,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.canvas,
  },
  rowTitle: {
    flex: 1,
    ...typography.body.medium,
    lineHeight: ROW_LINE_HEIGHT,
    fontFamily: fonts.medium,
    color: colors.text.tertiary,
  },
});
