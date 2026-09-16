import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import {
  AccessibilityInfo,
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '../../common/Text';
import PagerDots from '../../common/PagerDots';
import { HeartRatePlacementIllustration } from '../../heartRate/HeartRatePlacementIllustration';
import {
  getOnboardingImageSource,
  type OnboardingImageKey,
} from '../../../services/images/onboardingImageCache';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import {
  ONBOARDING_VISUAL_MAX_WIDTH,
  scaleVisual,
} from '../onboardingVisualScale';

/**
 * The drawing above a step.
 *
 * `lensPlacement` draws the phone's own camera layout rather than a fixed
 * picture: which lens to cover depends on whether the phone has one, two, or
 * three cameras, so it reuses the highlighted-lens drawing from the live check
 * and the help sheet. A generic camera image would point at a lens this phone
 * does not measure from.
 */
type HeartRatePrepVisual =
  | { readonly kind: 'image'; readonly key: OnboardingImageKey }
  | { readonly kind: 'lensPlacement' };

interface HeartRatePrepStep {
  readonly title: string;
  readonly detail: string;
  readonly visual: HeartRatePrepVisual;
}

export const HEART_RATE_PREP_STEPS: readonly HeartRatePrepStep[] = [
  {
    title: 'Warm your hands',
    detail:
      'Rub your hands together for about 30 seconds. If your case overlaps the camera or flash, remove it.',
    visual: { kind: 'image', key: 'heartRateWarmHands' },
  },
  {
    title: 'Cover the camera lens',
    detail:
      'Place the soft pad of your index finger flat over the highlighted lens. Keep the flash uncovered.',
    visual: { kind: 'lensPlacement' },
  },
  {
    title: 'Hold lightly and stay still',
    detail:
      'Rest your elbows on a table or your knees. Keep gentle contact, breathe normally, and don’t talk or adjust your grip.',
    visual: { kind: 'image', key: 'heartRateHoldStill' },
  },
];

/** One art box size for every step, so the copy below it never shifts on a swipe. */
const VISUAL_SIZE = Math.min(scaleVisual(290), ONBOARDING_VISUAL_MAX_WIDTH);
/** How far a step's copy rises as it takes over from the step before it. */
const COPY_RISE = 14;

interface HeartRatePlacementCarouselProps {
  index: number;
  onIndexChange: (index: number) => void;
}

export default function HeartRatePlacementCarousel({
  index,
  onIndexChange,
}: HeartRatePlacementCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const hasMountedRef = useRef(false);
  const [pageWidth, setPageWidth] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pageWidth === 0) return;
    scrollRef.current?.scrollTo({ x: index * pageWidth, animated: true });
  }, [index, pageWidth]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    AccessibilityInfo.announceForAccessibility(
      `Step ${index + 1} of ${HEART_RATE_PREP_STEPS.length}. ${HEART_RATE_PREP_STEPS[index].title}`,
    );
  }, [index]);

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (pageWidth === 0) return;
    const nextIndex = Math.max(
      0,
      Math.min(
        HEART_RATE_PREP_STEPS.length - 1,
        Math.round(event.nativeEvent.contentOffset.x / pageWidth),
      ),
    );
    if (nextIndex === index) return;
    onIndexChange(nextIndex);
  };

  return (
    <View
      style={styles.container}
      onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`Heart reading preparation, step ${index + 1} of ${HEART_RATE_PREP_STEPS.length}`}
    >
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        // The copy of each step is placed from the scroll position itself, so
        // next/back and a swipe both animate, and the movement tracks the
        // finger instead of starting once the page has landed.
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {HEART_RATE_PREP_STEPS.map((step, pageIndex) => (
          <HeartRatePrepPage
            key={step.title}
            step={step}
            pageIndex={pageIndex}
            width={pageWidth}
            scrollX={scrollX}
          />
        ))}
      </Animated.ScrollView>
      <PagerDots count={HEART_RATE_PREP_STEPS.length} index={index} />
    </View>
  );
}

interface HeartRatePrepPageProps {
  step: HeartRatePrepStep;
  pageIndex: number;
  width: number;
  scrollX: Animated.Value;
}

/** One step: the drawing rides the pager, the copy fades and rises into place. */
function HeartRatePrepPage({
  step,
  pageIndex,
  width,
  scrollX,
}: HeartRatePrepPageProps) {
  // Widths are zero until the container has measured; interpolating over an
  // empty range would divide by zero, so the copy simply holds still until then.
  const copyMotion =
    width === 0
      ? null
      : {
          opacity: scrollX.interpolate({
            inputRange: pageOffsets(pageIndex, width),
            outputRange: [0, 1, 0],
            extrapolate: 'clamp' as const,
          }),
          transform: [
            {
              translateY: scrollX.interpolate({
              inputRange: pageOffsets(pageIndex, width),
              outputRange: [COPY_RISE, 0, COPY_RISE],
                extrapolate: 'clamp' as const,
              }),
            },
          ],
        };

  return (
    <View style={[styles.page, { width }]}>
      <View style={styles.visual} importantForAccessibility="no-hide-descendants">
        {step.visual.kind === 'image' ? (
          <Image
            source={getOnboardingImageSource(step.visual.key)}
            style={styles.stepImage}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={0}
            accessible={false}
          />
        ) : (
          <HeartRatePlacementIllustration size={VISUAL_SIZE} />
        )}
      </View>
      <Animated.View style={[styles.copy, copyMotion]}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.detail}>{step.detail}</Text>
      </Animated.View>
    </View>
  );
}

/** This page's resting offset, with its neighbours on either side. */
function pageOffsets(pageIndex: number, width: number): number[] {
  return [(pageIndex - 1) * width, pageIndex * width, (pageIndex + 1) * width];
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.lg,
    overflow: 'hidden',
  },
  page: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  visual: {
    width: '100%',
    height: VISUAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepImage: {
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  detail: {
    ...typography.body.large,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
