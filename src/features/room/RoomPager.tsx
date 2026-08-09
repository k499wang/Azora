import { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Text } from '../../components/common/Text';
import PagerDots from '../../components/common/PagerDots';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';

interface RoomPagerProps<T> {
  items: T[];
  /** full window width — each page is exactly one screen across */
  pageWidth: number;
  initialIndex?: number;
  keyOf: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  captionOf: (item: T, index: number) => string;
  onIndexChange?: (index: number) => void;
}

/**
 * One room per page, swiped horizontally.
 *
 * A paged `ScrollView` rather than a `FlatList`: the hotel is a handful of
 * rooms, all of which the user wants to flick through freely, and virtualising
 * that many pages costs a blank frame on every swipe for nothing.
 */
export default function RoomPager<T>({
  items,
  pageWidth,
  initialIndex = 0,
  keyOf,
  renderItem,
  captionOf,
  onIndexChange,
}: RoomPagerProps<T>) {
  const [index, setIndex] = useState(initialIndex);
  const scroller = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (next === index || next < 0 || next >= items.length) return;

    setIndex(next);
    triggerTapHaptic();
    onIndexChange?.(next);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: initialIndex * pageWidth, y: 0 }}
        onMomentumScrollEnd={handleScroll}
      >
        {items.map((item, itemIndex) => (
          <View
            key={keyOf(item, itemIndex)}
            style={[styles.page, { width: pageWidth }]}
          >
            {renderItem(item, itemIndex)}
          </View>
        ))}
      </ScrollView>

      <Text style={styles.caption}>
        {items.length === 0 ? '' : captionOf(items[index], index)}
      </Text>

      <PagerDots count={items.length} index={index} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    ...typography.title.title3,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
