import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from './Text';
import Icon from './icons/Icon';

/** matches `AppTopBar`, so a collapsing bar is the height of every other one */
const BAR_HEIGHT = 58;
const BACK_ICON_SIZE = 26;

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

/** Where the bar ends on screen: the first y content can sit at without going under it. */
export function useCollapsingTitleBarBottom() {
  return useSafeAreaInsets().top + BAR_HEIGHT;
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
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
      </Animated.View>
    </View>
  );
}

/**
 * The large title of a pushed screen, with its back chevron beside it. Both
 * scroll away with the content; a `CollapsingTitleBar` then carries the title.
 */
export function CollapsingBackTitle({ title, style }: { title: string; style?: StyleProp<ViewStyle> }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ paddingTop: insets.top }, style]}>
      <View style={styles.backTitleRow}>
        {navigation.canGoBack() ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={spacing.md}
            style={({ pressed }) => [styles.back, pressed && pressable.control]}
            onPress={() => {
              triggerTapHaptic();
              navigation.goBack();
            }}
          >
            <Icon name="chevron-left" size={BACK_ICON_SIZE} color={colors.text.primary} />
          </Pressable>
        ) : null}
        <Text style={styles.backTitle}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    marginLeft: -spacing.xs,
    marginRight: spacing.xs,
  },
  backTitleRow: {
    minHeight: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  backTitle: {
    flexShrink: 1,
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
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
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
});
