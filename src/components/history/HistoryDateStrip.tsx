import { useCallback, useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from '../common/Text';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { radius } from '../../theme/card';
import { triggerTapHaptic } from '../../native/tapHaptics';
import type { WeekCalendarDay } from '../../lib/calendar/weekCalendarDays';

const DAYS_PER_SCREEN = 7;
const LETTER_SIZE = 26;

interface Props {
  days: WeekCalendarDay[];
  selectedLocalDate: string;
  onSelect: (localDate: string) => void;
  /**
   * Bump to scroll back to the newest week. Today is always on the last page —
   * the strip is built to end on the Saturday of today's week — so this needs
   * no date, only a signal that something asked to go back there.
   */
  jumpToLatestToken: number;
}

/** Sits on the header block, so every color here is picked against its fill. */
export default function HistoryDateStrip({
  days,
  selectedLocalDate,
  onSelect,
  jumpToLatestToken,
}: Props) {
  const { width } = useWindowDimensions();
  // No screen margin on purpose: a page has to be exactly the viewport wide for
  // `pagingEnabled` to land on week boundaries, and the strip is built to start
  // on a Sunday and end on a Saturday so every page is one whole week.
  const cellWidth = width / DAYS_PER_SCREEN;
  const scrollRef = useRef<ScrollView>(null);
  const openedOnLatestWeek = useRef(false);

  // Opens on the most recent week rather than the oldest day we loaded. Waiting
  // for content size means the scroll lands after layout, not before it.
  const scrollToLatestWeek = useCallback(() => {
    if (openedOnLatestWeek.current) return;
    openedOnLatestWeek.current = true;
    scrollRef.current?.scrollToEnd({ animated: false });
  }, []);

  useEffect(() => {
    if (jumpToLatestToken === 0) return;
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [jumpToLatestToken]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      pagingEnabled
      onContentSizeChange={scrollToLatestWeek}
    >
      {days.map((day) => {
        const selected = day.localDate === selectedLocalDate;

        return (
          <Pressable
            key={day.key}
            accessibilityRole="button"
            accessibilityLabel={`${day.dayShortLabel} ${day.dateNum}`}
            accessibilityState={{ selected, disabled: day.isFuture }}
            disabled={day.isFuture}
            onPress={() => {
              triggerTapHaptic();
              if (selected) return;
              onSelect(day.localDate);
            }}
            style={[styles.cell, { width: cellWidth }]}
          >
            <View style={[styles.cellInner, selected && styles.cellSelected]}>
              <View style={[styles.letter, selected && styles.letterSelected]}>
                <Text
                  style={[
                    styles.letterText,
                    selected && styles.letterTextSelected,
                    day.isFuture && styles.faint,
                  ]}
                >
                  {day.dayLabel}
                </Text>
              </View>
              <Text
                style={[styles.dateNum, day.isFuture && styles.faint]}
              >
                {day.dateNum}
              </Text>
              <View
                style={[styles.marker, day.isCompleted && styles.markerDone]}
              />
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.md,
  },
  cell: {
    alignItems: 'center',
    // Keeps the selected pill off its neighbours and off the screen edge now
    // that the cells run full-bleed.
    paddingHorizontal: spacing.xs,
  },
  cellInner: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
    borderCurve: 'continuous',
  },
  cellSelected: {
    backgroundColor: colors.onBlock.fill,
  },
  letter: {
    width: LETTER_SIZE,
    height: LETTER_SIZE,
    borderRadius: LETTER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterSelected: {
    backgroundColor: colors.text.inverse,
  },
  letterText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.onBlock.textMuted,
  },
  letterTextSelected: {
    color: colors.playful.teal.ink,
  },
  dateNum: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  faint: {
    color: colors.onBlock.textFaint,
  },
  marker: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'transparent',
  },
  markerDone: {
    backgroundColor: colors.text.inverse,
  },
});
