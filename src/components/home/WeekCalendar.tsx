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

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TOTAL_DAYS = 28;
const PILL_GAP = spacing.sm;

function buildDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Today sits at second-to-last position in a visible 7-day window.
  // Total = 28 days: indices 0..26 are past/today, 27 is tomorrow.
  // Today index = TOTAL_DAYS - 2 = 26.
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
    };
  });
}

interface WeekCalendarProps {
  onSelectDay?: (daysAgo: number) => void;
}

export default function WeekCalendar({ onSelectDay }: WeekCalendarProps) {
  const days = useMemo(() => buildDays(), []);
  const todayIndex = TOTAL_DAYS - 2;
  const [selectedIndex, setSelectedIndex] = useState(todayIndex);
  const scrollRef = useRef<ScrollView>(null);
  const [pillWidth, setPillWidth] = useState(0);

  const onContainerLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const containerWidth = e.nativeEvent.layout.width;
      const viewportWidth = containerWidth - padding.screen.horizontal * 2;
      // 7 pills visible with 6 gaps
      const w = (viewportWidth - PILL_GAP * 6) / 7;
      setPillWidth(w);

      // Align to the start of the final 7-day window so only whole pills show.
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
                style={[
                  styles.pill,
                  { width: pillWidth },
                  isSelected && styles.pillSelected,
                  isFuture && styles.pillFuture,
                ]}
                onPress={() => handlePress(index)}
                disabled={isFuture}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isSelected && styles.dayLabelSelected,
                    isFuture && styles.dayLabelFuture,
                  ]}
                >
                  {day.dayLabel}
                </Text>
                <Text
                  style={[
                    styles.dateNum,
                    isSelected && styles.dateNumSelected,
                    isFuture && styles.dateNumFuture,
                  ]}
                >
                  {day.dateNum}
                </Text>
                {day.isToday && !isSelected ? (
                  <View style={styles.todayDot} />
                ) : null}
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
  pill: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.background.elevated,
    gap: 1,
  },
  pillSelected: {
    backgroundColor: colors.primary.blue600,
  },
  pillFuture: {
    opacity: 0.4,
  },
  dayLabel: {
    ...typography.caption.caption1,
    color: colors.text.brand,
  },
  dayLabelSelected: {
    color: colors.primary.blue100,
  },
  dayLabelFuture: {
    color: colors.text.tertiary,
  },
  dateNum: {
    ...typography.label.medium,
    color: colors.text.primary,
  },
  dateNumSelected: {
    color: colors.text.inverse,
  },
  dateNumFuture: {
    color: colors.text.tertiary,
  },
  todayDot: {
    position: 'absolute',
    bottom: 3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary.blue500,
  },
});
