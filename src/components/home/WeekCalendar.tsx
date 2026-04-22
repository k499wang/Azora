import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  LayoutChangeEvent,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, padding, margin } from '../../theme/spacing';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const TOTAL_DAYS = 28;
const PILL_GAP = spacing.sm;
const CIRCLE_SIZE = 34;

function buildDays(completedDaysAgo: Set<number>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIndex = TOTAL_DAYS - 2;

  return Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const offset = i - todayIndex;
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    return {
      key: date.toISOString(),
      dayLabel: DAY_LABELS[date.getDay()],
      dateNum: date.getDate(),
      isToday: offset === 0,
      isFuture: offset > 0,
      isCompleted: offset <= 0 && completedDaysAgo.has(-offset),
    };
  });
}

interface WeekCalendarProps {
  onSelectDay?: (daysAgo: number) => void;
  completedDaysAgo?: number[];
}

export default function WeekCalendar({
  onSelectDay,
  completedDaysAgo = [1, 2, 4],
}: WeekCalendarProps) {
  const completedSet = useMemo(() => new Set(completedDaysAgo), [completedDaysAgo]);
  const days = useMemo(() => buildDays(completedSet), [completedSet]);
  const todayIndex = TOTAL_DAYS - 2;
  const [selectedIndex, setSelectedIndex] = useState(todayIndex);
  const scrollRef = useRef<ScrollView>(null);
  const [pillWidth, setPillWidth] = useState(0);

  const onContainerLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const containerWidth = e.nativeEvent.layout.width;
      const viewportWidth = containerWidth - padding.screen.horizontal * 2;
      const w = (viewportWidth - PILL_GAP * 6) / 7;
      setPillWidth(w);

      const scrollTo = (TOTAL_DAYS - 7) * (w + PILL_GAP);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: scrollTo, animated: false });
      }, 0);
    },
    [todayIndex],
  );

  const handlePress = (index: number) => {
    if (days[index].isFuture) return;
    setSelectedIndex(index);
    onSelectDay?.(todayIndex - index);
  };

  return (
    <View style={styles.section} onLayout={onContainerLayout}>
      {pillWidth > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          snapToInterval={pillWidth + PILL_GAP}
          decelerationRate="fast"
        >
          {days.map((day, index) => {
            const isSelected = index === selectedIndex;
            const isFuture = day.isFuture;

            return (
              <Pressable
                key={day.key}
                style={[styles.dayItem, { width: pillWidth }, isFuture && styles.dayItemFuture]}
                onPress={() => handlePress(index)}
                disabled={isFuture}
              >
                <View
                  style={[
                    styles.circle,
                    day.isCompleted && styles.circleCompleted,
                    isSelected && styles.circleSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      day.isCompleted && styles.dayLabelCompleted,
                      isSelected && styles.dayLabelSelected,
                    ]}
                  >
                    {day.dayLabel}
                  </Text>
                </View>
                <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>
                  {day.dateNum}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  scrollContent: {
    gap: PILL_GAP,
  },
  dayItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayItemFuture: {
    opacity: 0.35,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[900],
    borderStyle: 'dashed',
  },
  circleSelected: {
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: colors.text.primary,
  },
  circleCompleted: {
    borderStyle: 'solid',
    borderWidth: 0,
    backgroundColor: colors.orange[500],
  },
  dayLabel: {
    ...typography.label.small,
    color: colors.text.secondary,
  },
  dayLabelSelected: {
    ...typography.label.medium,
    color: colors.text.primary,
  },
  dayLabelCompleted: {
    color: colors.text.inverse,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
  },
  dateNum: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
  dateNumSelected: {
    ...typography.label.small,
    color: colors.text.primary,
  },
});
