import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from './Text';

/** matches `AppTopBar`, so a collapsing bar is the height of every other one */
const BAR_HEIGHT = 58;

/**
 * The scroll range the bar collapses over, in points, measured from the top of
 * the large title. Apple's navigation bar swaps appearance the moment the
 * title it duplicates passes underneath it; fading across the title's own
 * height is what makes the two read as one title rather than two.
 */
const COLLAPSE_START = 8;
const COLLAPSE_END = 40;

/**
 * Drives a `CollapsingTitleBar` from the scroll view it sits over.
 *
 * Hand `onScroll` to an `Animated.ScrollView` and `scrollY` to the bar. The
 * screen keeps its own content — a large title, whatever sits beside it, the
 * top padding that clears the status bar — because none of that is shared.
 */
export function useCollapsingTitle() {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  return { scrollY, onScroll };
}

/** The top padding a screen's content needs to clear the status bar. */
export function useCollapsingContentInset() {
  return useSafeAreaInsets().top + spacing.sm;
}

interface Props {
  title: string;
  scrollY: SharedValue<number>;
}

/**
 * Pure chrome: transparent until the screen's own title scrolls under it, then
 * a solid bar carrying the same title inline. Nothing in it is touchable, so
 * whatever is underneath keeps scrolling.
 */
export default function CollapsingTitleBar({ title, scrollY }: Props) {
  const insets = useSafeAreaInsets();
  const collapsed = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [COLLAPSE_START, COLLAPSE_END],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View style={[styles.bar, { paddingTop: insets.top }]} pointerEvents="none">
      <Animated.View
        style={[StyleSheet.absoluteFill, collapsed]}
        pointerEvents="none"
      >
        <View style={styles.fill} />
        <View style={styles.hairline} />
      </Animated.View>

      <Animated.View style={[styles.row, collapsed]}>
        <Text style={styles.title}>{title}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.canvas,
  },
  hairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },
  row: {
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
});
