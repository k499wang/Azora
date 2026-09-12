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
  /**
   * Fixes each page to the room's own height, so the room sits at a place the
   * caller chose rather than wherever the pager's caption and dots leave it.
   */
  pageHeight?: number;
  initialIndex?: number;
  keyOf: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  captionOf: (item: T, index: number) => string;
  onIndexChange?: (index: number) => void;
  /**
   * Drawn on the reward's field rather than the app's canvas, where the room
   * names are ink on cream and disappear.
   */
  onField?: boolean;
  /**
   * The name and the dots under the pages.
   *
   * A caller that has somewhere better to put them — the reward's tray, where
   * every other word in that flow lives — turns them off and owns them itself,
   * which also leaves the pager as nothing but its rooms. Anything that then
   * moves the pager moves only rooms.
   */
  chrome?: boolean;
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
  pageHeight,
  initialIndex = 0,
  keyOf,
  renderItem,
  captionOf,
  onIndexChange,
  onField = false,
  chrome = true,
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
            style={[styles.page, { width: pageWidth, height: pageHeight }]}
          >
            {renderItem(item, itemIndex)}
          </View>
        ))}
      </ScrollView>

      {chrome ? (
        <>
          <Text style={[styles.caption, onField && styles.captionOnField]}>
            {items.length === 0 ? '' : captionOf(items[index], index)}
          </Text>

          <PagerDots count={items.length} index={index} onField={onField} />
        </>
      ) : null}
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
  captionOnField: {
    color: colors.text.inverse,
  },
});
