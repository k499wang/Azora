import { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { Text } from '../../common/Text';
import { card, radius } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { ONBOARDING_VISUAL_MAX_WIDTH } from '../onboardingVisualScale';
import useCleaningPreviewAnimation from './useCleaningPreviewAnimation';
import {
  CLEANING_PREVIEW_TIMELINE as timeline,
  getCleaningPinEndpoints,
  getCleaningPinPosition,
  getCleaningWipeWidth,
  type CleaningPreviewLayout as Layout,
  type CleaningPreviewPoint as Point,
} from './cleaningPreviewMotion';

const PIN_SIZE = 32;
const STEPS = [
  {
    label: 'Clothes',
    text: 'Put clothes in a basket.',
    bounds: { x: 0.56, y: 0.54, width: 0.22, height: 0.17 },
  },
  {
    label: 'Bedding',
    text: 'Straighten the bedding.',
    bounds: { x: 0.1, y: 0.42, width: 0.34, height: 0.21 },
  },
  {
    label: 'Dresser',
    text: 'Clear the dresser.',
    bounds: { x: 0.64, y: 0.26, width: 0.29, height: 0.12 },
  },
] as const;

function sameLayout(previous: Layout | null, next: Layout) {
  return previous?.x === next.x && previous.y === next.y
    && previous.width === next.width && previous.height === next.height;
}

function updateLayout(previous: (Layout | null)[], index: number, next: Layout) {
  if (sameLayout(previous[index], next)) return previous;
  const measured = [...previous];
  measured[index] = next;
  return measured;
}

function StepAnnotation({
  index, photo, elapsed, staticMode,
}: {
  index: number;
  photo: Layout | null;
  elapsed: SharedValue<number>;
  staticMode: boolean;
}) {
  const detected = timeline.pinStarts[index];
  const departure = timeline.taskStarts[index];
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: staticMode ? 1 : interpolate(
      elapsed.value,
      [detected - 100, detected, departure, departure + 150],
      [0, 1, 1, 0],
      'clamp',
    ),
  }));
  const { bounds, label } = STEPS[index];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.annotation,
        {
          left: bounds.x * (photo?.width ?? 0),
          top: bounds.y * (photo?.height ?? 0),
          width: bounds.width * (photo?.width ?? 0),
          height: bounds.height * (photo?.height ?? 0),
        },
        animatedStyle,
      ]}
    >
      <View style={styles.annotationLabel}>
        <Text style={styles.annotationLabelText}>{label}</Text>
      </View>
    </Animated.View>
  );
}

function FlyingPin({
  index, start, end, elapsed, staticMode, showAfter,
}: {
  index: number;
  start: Point;
  end: Point;
  elapsed: SharedValue<number>;
  staticMode: boolean;
  showAfter: boolean;
}) {
  const departure = timeline.taskStarts[index];
  const arrival = departure + timeline.taskTravelDuration;
  const animatedStyle = useAnimatedStyle(() => {
    const progress = (elapsed.value - departure) / timeline.taskTravelDuration;
    const position = getCleaningPinPosition(staticMode ? 0 : progress, start, end);
    return {
      opacity: staticMode
        ? (showAfter ? 0 : 1)
        : elapsed.value >= timeline.pinStarts[index] && elapsed.value < arrival ? 1 : 0,
      transform: [
        { translateX: position.x - PIN_SIZE / 2 },
        { translateY: position.y - PIN_SIZE / 2 },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      style={[styles.flyingPin, styles.numberBadge, animatedStyle]}
    >
      <Text style={styles.numberText}>{index + 1}</Text>
    </Animated.View>
  );
}

function TaskCard({
  index, elapsed, staticMode, onLayout, onBadgeLayout,
}: {
  index: number;
  elapsed: SharedValue<number>;
  staticMode: boolean;
  onLayout: (layout: Layout) => void;
  onBadgeLayout: (layout: Layout) => void;
}) {
  const departure = timeline.taskStarts[index];
  const arrival = departure + timeline.taskTravelDuration;
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: staticMode ? 1 : interpolate(elapsed.value, [departure, departure + 200], [0, 1], 'clamp'),
    transform: [{
      translateY: staticMode ? 0 : interpolate(elapsed.value, [departure, departure + 200], [6, 0], 'clamp'),
    }],
    backgroundColor: index === 0 && (staticMode || elapsed.value >= timeline.focusStart)
      ? colors.surface.selected : colors.background.card,
    borderColor: index === 0 && (staticMode || elapsed.value >= timeline.focusStart)
      ? colors.primary.blue500 : colors.border.subtle,
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: staticMode || elapsed.value >= arrival ? 1 : 0,
  }));

  return (
    <Animated.View
      onLayout={({ nativeEvent }) => onLayout(nativeEvent.layout)}
      style={[styles.taskCard, animatedStyle]}
    >
      <Animated.View
        onLayout={({ nativeEvent }) => onBadgeLayout(nativeEvent.layout)}
        style={[styles.numberBadge, badgeStyle]}
      >
        <Text style={styles.numberText}>{index + 1}</Text>
      </Animated.View>
      <Text style={styles.taskText}>{STEPS[index].text}</Text>
    </Animated.View>
  );
}

export default function CleaningPreviewScene() {
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [photoLayout, setPhotoLayout] = useState<Layout | null>(null);
  const [planLayout, setPlanLayout] = useState<Layout | null>(null);
  const [taskLayouts, setTaskLayouts] = useState<(Layout | null)[]>(() => STEPS.map(() => null));
  const [badgeLayouts, setBadgeLayouts] = useState<(Layout | null)[]>(() => STEPS.map(() => null));
  const [showAfter, setShowAfter] = useState(false);
  const layoutsReady = !!photoLayout && photoLayout.width > 0 && !!planLayout
    && taskLayouts.every(Boolean) && badgeLayouts.every(Boolean);
  const ready = beforeLoaded && afterLoaded && layoutsReady && !imageError;
  const { elapsed, reducedMotion, replay } = useCleaningPreviewAnimation(ready);
  const staticMode = reducedMotion || imageError;
  const photoWidth = photoLayout?.width ?? 380;
  const photoHeight = photoLayout?.height ?? 380 * (432 / 694);

  const afterStyle = useAnimatedStyle(() => ({
    width: staticMode ? (showAfter ? photoWidth : 0) : getCleaningWipeWidth(elapsed.value, photoWidth),
  }));
  const beforeLabelStyle = useAnimatedStyle(() => ({
    opacity: staticMode ? (showAfter ? 0 : 1) : elapsed.value < timeline.wipeStart ? 1 : 0,
  }));
  const afterLabelStyle = useAnimatedStyle(() => ({
    opacity: staticMode ? (showAfter ? 1 : 0) : elapsed.value >= timeline.wipeEnd ? 1 : 0,
  }));
  const seamStyle = useAnimatedStyle(() => ({
    opacity: !staticMode && elapsed.value >= timeline.wipeStart && elapsed.value < timeline.wipeEnd ? 1 : 0,
    transform: [{ translateX: getCleaningWipeWidth(elapsed.value, photoWidth) - 1 }],
  }));
  const scanStyle = useAnimatedStyle(() => ({
    opacity: !staticMode && ready && elapsed.value >= timeline.scanStart && elapsed.value < timeline.scanEnd ? 1 : 0,
    transform: [{
      translateY: interpolate(elapsed.value, [timeline.scanStart, timeline.scanEnd], [0, photoHeight], 'clamp'),
    }],
  }));

  return (
    <View style={styles.preview}>
      <View
        style={styles.photoCard}
        onLayout={({ nativeEvent }) => {
          const next = nativeEvent.layout;
          setPhotoLayout((previous) => sameLayout(previous, next) ? previous : next);
        }}
        accessible
        accessibilityLabel="Bedroom preview showing clothes, bedding, and items on the dresser becoming three cleanup tasks."
      >
        <Image
          source={require('../../../../assets/onboarding/cleaning-before.jpg')}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          onLoad={() => setBeforeLoaded(true)}
          onError={() => setImageError(true)}
        />
        <Animated.View style={[styles.chip, beforeLabelStyle]}>
          <Text style={styles.chipText}>Before</Text>
        </Animated.View>
        {STEPS.map((_, index) => (
          <StepAnnotation key={index} index={index} photo={photoLayout} elapsed={elapsed} staticMode={staticMode} />
        ))}
        <Animated.View pointerEvents="none" style={[styles.scanBeam, scanStyle]} />
        <Animated.View style={[styles.afterClip, afterStyle]}>
          <Image
            source={require('../../../../assets/onboarding/cleaning-after.jpg')}
            style={[styles.fullPhoto, { width: photoWidth, height: photoHeight }]}
            contentFit="contain"
            onLoad={() => setAfterLoaded(true)}
            onError={() => setImageError(true)}
          />
          <Animated.View style={[styles.chip, afterLabelStyle]}>
            <Text style={styles.chipText}>After</Text>
          </Animated.View>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.wipeSeam, seamStyle]} />
        {imageError ? (
          <View style={styles.photoFallback}>
            <Text style={styles.taskText}>Photo preview unavailable</Text>
            <Text style={styles.caption}>Start with one small task below.</Text>
          </View>
        ) : null}
      </View>
      <View
        style={styles.plan}
        onLayout={({ nativeEvent }) => {
          const next = nativeEvent.layout;
          setPlanLayout((previous) => sameLayout(previous, next) ? previous : next);
        }}
        accessible
        accessibilityLabel={`Cleaning steps: ${STEPS.map((step, index) => `${index + 1}. ${step.text}`).join(' ')} Start with the clothes.`}
      >
        {STEPS.map((step, index) => (
          <TaskCard
            key={step.label}
            index={index}
            elapsed={elapsed}
            staticMode={staticMode}
            onLayout={(next) => setTaskLayouts((previous) => updateLayout(previous, index, next))}
            onBadgeLayout={(next) => setBadgeLayouts((previous) => updateLayout(previous, index, next))}
          />
        ))}
      </View>
      {!imageError ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={reducedMotion ? (showAfter ? 'Show before cleaning' : 'Show after cleaning') : 'Replay cleaning preview'}
          disabled={!ready}
          onPress={reducedMotion ? () => setShowAfter((previous) => !previous) : replay}
          style={({ pressed }) => [styles.replay, (!ready || pressed) && styles.replayDimmed]}
        >
          <Text style={styles.replayText}>{reducedMotion ? (showAfter ? 'See before' : 'See after') : 'Replay'}</Text>
        </Pressable>
      ) : null}
      {!imageError && layoutsReady ? STEPS.map((step, index) => {
        const endpoints = getCleaningPinEndpoints(
          step.bounds, photoLayout!, planLayout!, taskLayouts[index]!, badgeLayouts[index]!,
        );
        return (
          <FlyingPin
            key={step.label}
            index={index}
            {...endpoints}
            elapsed={elapsed}
            staticMode={staticMode}
            showAfter={showAfter}
          />
        );
      }) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: '100%', maxWidth: ONBOARDING_VISUAL_MAX_WIDTH, alignSelf: 'center', gap: spacing.lg,
  },
  photoCard: {
    ...card.base, width: '100%', aspectRatio: 694 / 432, overflow: 'hidden',
  },
  afterClip: {
    position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden',
  },
  fullPhoto: { position: 'absolute', left: 0, top: 0 },
  wipeSeam: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
    backgroundColor: colors.background.card,
  },
  chip: {
    position: 'absolute', left: spacing.sm, top: spacing.sm,
    backgroundColor: colors.background.card, borderRadius: radius.full,
    paddingVertical: spacing.xs + spacing.xs / 2, paddingHorizontal: spacing.sm + spacing.xs,
  },
  chipText: {
    ...typography.body.small, fontFamily: fonts.semibold, color: colors.text.primary,
  },
  annotation: {
    position: 'absolute', borderRadius: radius.xs,
    borderWidth: 2, borderColor: colors.primary.blue500,
    backgroundColor: `${colors.primary.blue500}30`,
  },
  annotationLabel: {
    position: 'absolute', left: 0, top: '100%', marginTop: spacing.xs,
    backgroundColor: colors.background.card, borderRadius: radius.xs,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2,
  },
  annotationLabelText: {
    ...typography.caption.caption1, fontFamily: fonts.semibold, color: colors.text.primary,
  },
  numberBadge: {
    width: PIN_SIZE, height: PIN_SIZE, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.blue500,
  },
  flyingPin: { position: 'absolute', left: 0, top: 0 },
  numberText: {
    ...typography.body.small, fontFamily: fonts.semibold, color: colors.text.inverse,
  },
  scanBeam: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 22,
    borderTopWidth: 3, borderColor: colors.primary.blue500,
    backgroundColor: `${colors.primary.blue500}45`,
  },
  photoFallback: {
    ...StyleSheet.absoluteFillObject, padding: spacing.lg, gap: spacing.sm,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.card,
  },
  plan: { gap: spacing.sm + spacing.xs },
  taskCard: {
    ...card.base, flexDirection: 'row', alignItems: 'center',
    minHeight: 72, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    gap: spacing.md, borderWidth: 1, borderRadius: radius.medium,
  },
  taskText: {
    ...typography.body.medium, flexShrink: 1,
    fontFamily: fonts.semibold, color: colors.text.primary,
  },
  caption: {
    ...typography.caption.caption1, textAlign: 'center', color: colors.text.secondary,
  },
  replay: {
    alignSelf: 'center', minHeight: 44, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    alignItems: 'center', justifyContent: 'center', borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border.subtle, backgroundColor: colors.background.card,
  },
  replayDimmed: { opacity: 0.5 },
  replayText: {
    ...typography.body.small, fontFamily: fonts.semibold, color: colors.text.brand,
  },
});
