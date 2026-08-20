import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const EDGE_PADDING = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;
// Below this a drag has no fling left, so no momentum event will follow and the
// column has to settle from the drag itself.
const RESTING_VELOCITY = 0.1;
// Between RN's 'fast' (0.99) and 'normal' (0.998). A fling coasts across several
// rows before snapping instead of stopping under the finger, and 60 minutes stay
// reachable in one throw without the wheel drifting for seconds.
const DECELERATION_RATE = 0.994;

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0'),
);
const PERIODS = ['AM', 'PM'];

interface InlineTimePickerProps {
  /** 24-hour `HH:MM`. */
  value: string;
  onChange: (next: string) => void;
  accessibilityLabel: string;
}

/**
 * Always-visible three-column wheel. Built on snapping scroll views rather than
 * the native spinner so the type, the selection band, and the fade off-centre
 * follow the app's tokens and render the same on both platforms.
 */
export default function InlineTimePicker({
  value,
  onChange,
  accessibilityLabel,
}: InlineTimePickerProps) {
  const selection = useMemo(() => parseTime(value), [value]);

  const emit = (next: Partial<TimeSelection>) => {
    onChange(formatTime({ ...selection, ...next }));
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: readableTime(value) }}
      style={styles.wheel}
    >
      <View pointerEvents="none" style={styles.band} />
      <View style={styles.columns}>
        <WheelColumn
          items={HOURS}
          selectedIndex={selection.hourIndex}
          onSelect={(hourIndex) => emit({ hourIndex })}
          align="flex-end"
        />
        <WheelColumn
          items={MINUTES}
          selectedIndex={selection.minuteIndex}
          onSelect={(minuteIndex) => emit({ minuteIndex })}
          align="center"
        />
        <WheelColumn
          items={PERIODS}
          selectedIndex={selection.periodIndex}
          onSelect={(periodIndex) => emit({ periodIndex })}
          align="flex-start"
        />
      </View>
    </View>
  );
}

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  align: 'flex-start' | 'center' | 'flex-end';
}

function WheelColumn({
  items,
  selectedIndex,
  onSelect,
  align,
}: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const offset = useRef(new Animated.Value(selectedIndex * ITEM_HEIGHT)).current;
  // The index this column last settled on. A prop change matching it came from
  // this column, so re-scrolling to it would fight the gesture that caused it.
  const settledIndex = useRef(selectedIndex);
  const hapticIndex = useRef(selectedIndex);

  // Android ignores `contentOffset`, so the resting row has to be scrolled to
  // once the rows have laid out.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    scrollRef.current?.scrollTo({
      y: settledIndex.current * ITEM_HEIGHT,
      animated: false,
    });
  }, []);

  useEffect(() => {
    if (selectedIndex === settledIndex.current) return;
    settledIndex.current = selectedIndex;
    hapticIndex.current = selectedIndex;
    scrollRef.current?.scrollTo({
      y: selectedIndex * ITEM_HEIGHT,
      animated: true,
    });
  }, [selectedIndex]);

  const indexAt = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    clampIndex(
      Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT),
      items.length,
    );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: offset } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = indexAt(event);
        if (index === hapticIndex.current) return;
        hapticIndex.current = index;
        triggerTapHaptic();
      },
    },
  );

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = indexAt(event);
    if (index === settledIndex.current) return;
    settledIndex.current = index;
    onSelect(index);
  };

  const handleDragEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Math.abs(event.nativeEvent.velocity?.y ?? 0) > RESTING_VELOCITY) return;
    settle(event);
  };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.column}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      snapToAlignment="start"
      decelerationRate={DECELERATION_RATE}
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: selectedIndex * ITEM_HEIGHT }}
      contentContainerStyle={styles.columnContent}
      onScroll={handleScroll}
      onMomentumScrollEnd={settle}
      onScrollEndDrag={handleDragEnd}
    >
      {items.map((item, index) => (
        <WheelItem
          key={item}
          label={item}
          index={index}
          offset={offset}
          align={align}
        />
      ))}
    </Animated.ScrollView>
  );
}

interface WheelItemProps {
  label: string;
  index: number;
  offset: Animated.Value;
  align: 'flex-start' | 'center' | 'flex-end';
}

function WheelItem({ label, index, offset, align }: WheelItemProps) {
  const neighbourhood = [
    (index - 2) * ITEM_HEIGHT,
    (index - 1) * ITEM_HEIGHT,
    index * ITEM_HEIGHT,
    (index + 1) * ITEM_HEIGHT,
    (index + 2) * ITEM_HEIGHT,
  ];

  const opacity = offset.interpolate({
    inputRange: neighbourhood,
    outputRange: [0.18, 0.45, 1, 0.45, 0.18],
    extrapolate: 'clamp',
  });
  const scale = offset.interpolate({
    inputRange: neighbourhood,
    outputRange: [0.78, 0.88, 1, 0.88, 0.78],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.item,
        { alignItems: align, opacity, transform: [{ scale }] },
      ]}
    >
      <Animated.Text style={styles.itemLabel}>{label}</Animated.Text>
    </Animated.View>
  );
}

interface TimeSelection {
  hourIndex: number;
  minuteIndex: number;
  periodIndex: number;
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(length - 1, index));
}

function parseTime(value: string): TimeSelection {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour24 = Number.isFinite(Number(hourRaw)) ? Number(hourRaw) : 8;
  const minute = Number.isFinite(Number(minuteRaw)) ? Number(minuteRaw) : 0;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return {
    hourIndex: clampIndex(hour12 - 1, HOURS.length),
    minuteIndex: clampIndex(minute, MINUTES.length),
    periodIndex: hour24 >= 12 ? 1 : 0,
  };
}

function formatTime({
  hourIndex,
  minuteIndex,
  periodIndex,
}: TimeSelection): string {
  const hour12 = hourIndex + 1;
  const base = hour12 === 12 ? 0 : hour12;
  const hour24 = periodIndex === 1 ? base + 12 : base;

  return `${String(hour24).padStart(2, '0')}:${MINUTES[minuteIndex]}`;
}

function readableTime(value: string): string {
  const { hourIndex, minuteIndex, periodIndex } = parseTime(value);
  return `${HOURS[hourIndex]}:${MINUTES[minuteIndex]} ${PERIODS[periodIndex]}`;
}

const styles = StyleSheet.create({
  wheel: {
    alignSelf: 'stretch',
    height: WHEEL_HEIGHT,
    justifyContent: 'center',
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT + spacing.xs,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    backgroundColor: colors.primary.blue100,
  },
  columns: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  column: {
    width: 84,
    height: WHEEL_HEIGHT,
  },
  columnContent: {
    paddingVertical: EDGE_PADDING,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  itemLabel: {
    ...typography.stat.valueMedium,
    color: colors.primary.blue700,
  },
});
