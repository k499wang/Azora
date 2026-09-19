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
import { Text } from '../common/Text';
import PagerDots from '../common/PagerDots';
import { HeartRatePlacementIllustration } from './HeartRatePlacementIllustration';
import {
  getOnboardingImageSource,
  type OnboardingImageKey,
} from '../../services/images/onboardingImageCache';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

type StepVisual =
  | { readonly kind: 'image'; readonly key: OnboardingImageKey }
  | { readonly kind: 'lensPlacement' };

interface InstructionStep {
  readonly title: string;
  readonly detail: string;
  readonly visual: StepVisual;
}

interface HeartRateInstructionCarouselProps {
  steps: readonly InstructionStep[];
  index: number;
  onIndexChange: (index: number) => void;
}

const VISUAL_SIZE = 240;
const COPY_RISE = 14;

export function HeartRateInstructionCarousel({
  steps,
  index,
  onIndexChange,
}: HeartRateInstructionCarouselProps) {
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
      `Step ${index + 1} of ${steps.length}. ${steps[index].title}`,
    );
  }, [index, steps]);

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (pageWidth === 0) return;
    const nextIndex = Math.max(
      0,
      Math.min(
        steps.length - 1,
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
      accessibilityLabel={`Heart rate instructions, step ${index + 1} of ${steps.length}`}
    >
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {steps.map((step, pageIndex) => (
          <InstructionPage
            key={step.title}
            step={step}
            pageIndex={pageIndex}
            width={pageWidth}
            scrollX={scrollX}
          />
        ))}
      </Animated.ScrollView>
      <PagerDots count={steps.length} index={index} />
    </View>
  );
}

interface InstructionPageProps {
  step: InstructionStep;
  pageIndex: number;
  width: number;
  scrollX: Animated.Value;
}

function InstructionPage({
  step,
  pageIndex,
  width,
  scrollX,
}: InstructionPageProps) {
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
