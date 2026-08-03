import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../common/Text';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import {
  buildWeekCalendarDays,
  formatLocalDate,
} from '../../lib/calendar/weekCalendarDays';
import { WEEK_LENGTH_DAYS } from '../../lib/weeklyProgress';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';

interface Props {
  currentStreak: number;
  completedDaysAgo: readonly number[];
  /** Fills today's circle in when this session is what put today on the board. */
  animateIncrement?: boolean;
}

// Long enough for the result screen to settle before today's circle fills in.
const CELEBRATION_DELAY_MS = 500;
const POP_SPRING = { damping: 8, stiffness: 180 } as const;

function streakLabelFor(streak: number): string {
  if (streak <= 0) return 'Streak started';
  return `${streak} day${streak === 1 ? '' : 's'} in a row`;
}

export default function SessionStreakCard({
  currentStreak,
  completedDaysAgo,
  animateIncrement = false,
}: Props) {
  const days = useMemo(
    () =>
      buildWeekCalendarDays(
        formatLocalDate(new Date()),
        [...completedDaysAgo],
        WEEK_LENGTH_DAYS,
      ),
    [completedDaysAgo],
  );

  // The profile summary refetches in the background while this screen is open,
  // and once the server has counted today the parent stops asking for an
  // increment. Latch the decision at mount so that refresh cannot cancel a
  // celebration that is already half played.
  const [celebrates] = useState(animateIncrement);

  const todayFill = useSharedValue(celebrates ? 0 : 1);

  useEffect(() => {
    if (!celebrates) return;

    todayFill.value = withDelay(
      CELEBRATION_DELAY_MS,
      withSpring(1, POP_SPRING),
    );

    const timer = setTimeout(() => {
      if (isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    }, CELEBRATION_DELAY_MS);

    return () => clearTimeout(timer);
  }, [celebrates, todayFill]);

  const todayDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + todayFill.value * 0.3 }],
    backgroundColor: interpolateColor(
      todayFill.value,
      [0, 1],
      [colors.background.secondary, colors.primary.blue600],
    ),
  }));

  const todayCheckStyle = useAnimatedStyle(() => ({
    opacity: todayFill.value,
  }));

  return (
    <View style={[card.base, styles.container]}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons
          name="fire"
          size={26}
          color={colors.mood.lowEnergy}
        />
        <Text style={styles.streakLabel}>{streakLabelFor(currentStreak)}</Text>
      </View>

      <View style={styles.weekRow}>
        {days.map((day) => {
          const celebratesToday = celebrates && day.isToday && day.isCompleted;

          return (
            <View key={day.key} style={styles.dayItem}>
              <Text
                style={[styles.dayLabel, day.isCompleted && styles.dayLabelDone]}
              >
                {day.dayLabel}
              </Text>
              <Animated.View
                style={[
                  styles.dayDot,
                  day.isCompleted && !celebratesToday && styles.dayDotDone,
                  day.isToday && styles.dayDotToday,
                  celebratesToday && todayDotStyle,
                ]}
              >
                {day.isCompleted ? (
                  <Animated.View style={celebratesToday ? todayCheckStyle : null}>
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={colors.text.inverse}
                    />
                  </Animated.View>
                ) : null}
              </Animated.View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  streakLabel: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  dayLabelDone: {
    color: colors.text.secondary,
  },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  dayDotDone: {
    backgroundColor: colors.primary.blue600,
  },
  dayDotToday: {
    borderWidth: 2,
    borderColor: colors.primary.blue400,
  },
});
