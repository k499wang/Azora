import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import ChunkyButton, { CHUNKY_TONE_SOFT } from '../../common/ChunkyButton';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import { card, radius } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { duration, easing, spring } from '../../../theme/motion';
import { triggerMediumHaptic } from '../../../native/tapHaptics';
import type {
  StarterPlanDecision,
  StarterPlanDecisions,
  StarterPlanItem,
} from '../../../lib/onboardingStarterPlan';
import { habitSwipeDecision } from '../../../lib/onboardingHabitSwipe';
import OnboardingOptionIcon from '../OnboardingOptionIcon';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';

interface RecommendedHabitsScreenProps {
  items: StarterPlanItem[];
  decisions: StarterPlanDecisions;
  stepIndex: number;
  stepCount: number;
  onDecide: (id: string, decision: StarterPlanDecision) => void;
  onRestart: () => void;
  onContinue: () => void;
  onBack: () => void;
}

const EXIT_DISTANCE = 520;

/**
 * Lets someone keep the habits that fit and decline the ones that do not.
 * Choices belong to the onboarding flow, not this screen, so leaving and
 * returning never changes what will later be written to their routine.
 */
export default function RecommendedHabitsScreen({
  items,
  decisions,
  stepIndex,
  stepCount,
  onDecide,
  onRestart,
  onContinue,
  onBack,
}: RecommendedHabitsScreenProps) {
  const reducedMotion = useReducedMotion();
  const currentIndex = items.findIndex((item) => decisions[item.id] == null);
  const visibleIndex = currentIndex < 0 ? items.length : currentIndex;
  const currentItem = items[visibleIndex] ?? null;
  const isComplete = currentItem == null;
  const deckPosition = useSharedValue(visibleIndex);
  const dragX = useSharedValue(0);
  const exitDirection = useSharedValue(0);
  const deckOpacity = useSharedValue(1);
  const gestureLocked = useSharedValue(false);
  const resolvingRef = useRef(false);
  const resettingRef = useRef(false);
  const targetIndexRef = useRef(visibleIndex);
  const backQueuedRef = useRef(false);
  const backSentRef = useRef(false);
  const [isResolving, setIsResolving] = useState(false);
  const [stackHeight, setStackHeight] = useState(300);

  const flushQueuedBack = useCallback(() => {
    if (!backQueuedRef.current || backSentRef.current) return;
    backQueuedRef.current = false;
    backSentRef.current = true;
    onBack();
  }, [onBack]);

  const handleBack = useCallback(() => {
    if (backSentRef.current || backQueuedRef.current) return;
    if (resolvingRef.current || gestureLocked.value) {
      backQueuedRef.current = true;
      return;
    }
    backSentRef.current = true;
    onBack();
  }, [gestureLocked, onBack]);

  const measureCard = useCallback((event: LayoutChangeEvent) => {
    const height = Math.ceil(event.nativeEvent.layout.height);
    setStackHeight((current) => Math.max(current, height));
  }, []);

  const finishRestartEntrance = useCallback(() => {
    resolvingRef.current = false;
    gestureLocked.value = false;
    setIsResolving(false);
    flushQueuedBack();
  }, [flushQueuedBack, gestureLocked]);

  useEffect(() => {
    if (resettingRef.current) {
      if (visibleIndex !== 0) return;
      resettingRef.current = false;
      deckOpacity.value = withTiming(1, {
        duration: reducedMotion ? 0 : duration.fast,
        easing: easing.enter,
      }, (finished) => {
        if (finished) runOnJS(finishRestartEntrance)();
      });
      return;
    } else if (!resolvingRef.current) {
      // Returning to this step can bring decisions made in an earlier visit.
      deckPosition.value = visibleIndex;
    } else if (visibleIndex !== targetIndexRef.current) {
      return;
    }
    resolvingRef.current = false;
    gestureLocked.value = false;
    setIsResolving(false);
    flushQueuedBack();
  }, [deckOpacity, deckPosition, finishRestartEntrance, flushQueuedBack, gestureLocked, reducedMotion, visibleIndex]);

  useEffect(
    () => () => {
      cancelAnimation(deckPosition);
      cancelAnimation(deckOpacity);
      cancelAnimation(dragX);
    },
    [deckPosition, deckOpacity, dragX],
  );

  const resolveDecision = useCallback(
    (id: string, decision: StarterPlanDecision) => {
      onDecide(id, decision);
    },
    [onDecide],
  );

  const decideCurrentHabit = useCallback(
    (decision: StarterPlanDecision, fromSwipe = false) => {
      if (currentItem == null || resolvingRef.current) return;

      if (fromSwipe) triggerMediumHaptic();
      resolvingRef.current = true;
      gestureLocked.value = true;
      setIsResolving(true);
      const itemId = currentItem.id;
      const nextIndex = items.findIndex(
        (item, index) => index > visibleIndex && decisions[item.id] == null,
      );
      targetIndexRef.current = nextIndex < 0 ? items.length : nextIndex;
      exitDirection.value = decision === 'accepted' ? 1 : -1;
      dragX.value = withTiming(0, {
        duration: reducedMotion ? 0 : duration.base,
        easing: easing.exit,
      });
      deckPosition.value = withTiming(
        targetIndexRef.current,
        { duration: reducedMotion ? 0 : duration.base, easing: easing.exit },
        (finished) => {
          if (finished) {
            runOnJS(resolveDecision)(itemId, decision);
          }
        },
      );
    },
    [currentItem, decisions, deckPosition, dragX, exitDirection, gestureLocked, items, reducedMotion, resolveDecision, visibleIndex],
  );

  const finishRestart = useCallback(() => {
    onRestart();
  }, [onRestart]);

  const restartChoices = useCallback(() => {
    if (!isComplete || resolvingRef.current) return;
    resolvingRef.current = true;
    resettingRef.current = true;
    gestureLocked.value = true;
    setIsResolving(true);
    deckOpacity.value = withTiming(
      0,
      { duration: reducedMotion ? 0 : duration.fast, easing: easing.exit },
      (finished) => {
        if (!finished) return;
        // Change the deck and its content only while both are fully hidden.
        deckPosition.value = 0;
        dragX.value = 0;
        exitDirection.value = 0;
        runOnJS(finishRestart)();
      },
    );
  }, [deckOpacity, deckPosition, dragX, exitDirection, finishRestart, gestureLocked, isComplete, reducedMotion]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(currentItem != null && !isResolving)
        .activeOffsetX([-10, 10])
        .failOffsetY([-24, 24])
        .maxPointers(1)
        .onUpdate((event) => {
          if (gestureLocked.value) return;
          dragX.value = event.translationX;
        })
        .onEnd((event) => {
          if (gestureLocked.value) return;
          const decision = habitSwipeDecision(event.translationX, event.velocityX);
          if (decision != null) {
            gestureLocked.value = true;
            runOnJS(decideCurrentHabit)(decision, true);
            return;
          }

          dragX.value = withSpring(0, spring.settle);
        }),
    [currentItem, decideCurrentHabit, dragX, gestureLocked, isResolving],
  );

  const fadeStyle = useAnimatedStyle(() => ({ opacity: deckOpacity.value }));
  const swipeGuideStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(items.length - deckPosition.value, 0), 1),
  }));

  return (
    <OnboardingScreenLayout
      title="Your Recommended Habits"
      subtitle="We picked these habits to fit the goals you shared."
      progress={stepIndex / stepCount}
      onBack={handleBack}
      footer={
        <Animated.View style={[styles.footer, fadeStyle]}>
          {isComplete ? (
            <OnboardingPrimaryButton label="Continue" onPress={onContinue} disabled={isResolving} />
          ) : (
            <View style={styles.actions}>
              <ChunkyButton
                label="Remove this habit"
                tone={CHUNKY_TONE_SOFT}
                onPress={() => decideCurrentHabit('rejected')}
                disabled={isResolving}
                style={styles.actionButton}
              />
              <ChunkyButton
                label="Build this habit"
                onPress={() => decideCurrentHabit('accepted')}
                disabled={isResolving}
                style={styles.actionButton}
              />
            </View>
          )}
        </Animated.View>
      }
    >
      <Animated.View style={[styles.deck, fadeStyle]}>
        <GestureDetector gesture={gesture}>
          <View style={[styles.cardStack, { minHeight: stackHeight }]}>
            <DeckCard
              index={items.length}
              active={isComplete && !isResolving}
              deckPosition={deckPosition}
              dragX={dragX}
              exitDirection={exitDirection}
              onLayout={measureCard}
            >
              <ReviewCard onRestart={restartChoices} />
            </DeckCard>
            {[...items].reverse().map((item, reverseIndex) => {
              const index = items.length - reverseIndex - 1;
              return (
                <DeckCard
                  key={item.id}
                  index={index}
                  active={visibleIndex === index}
                  deckPosition={deckPosition}
                  dragX={dragX}
                  exitDirection={exitDirection}
                  onLayout={measureCard}
                >
                  <HabitCard item={item} />
                </DeckCard>
              );
            })}
          </View>
        </GestureDetector>
        <Animated.View
          style={[styles.swipeGuide, swipeGuideStyle]}
          accessibilityElementsHidden={isComplete}
          importantForAccessibility={isComplete ? 'no-hide-descendants' : 'auto'}
          pointerEvents="none"
        >
          <View style={styles.swipeGuideItem}>
            <Icon name="arrow-left" size={16} color={colors.text.tertiary} />
            <Text style={styles.swipeGuideLabel}>Swipe left to remove</Text>
          </View>
          <View style={[styles.swipeGuideItem, styles.swipeGuideRight]}>
            <Text style={styles.swipeGuideLabel}>Swipe right to build</Text>
            <Icon name="arrow-right" size={16} color={colors.text.tertiary} />
          </View>
        </Animated.View>
      </Animated.View>
    </OnboardingScreenLayout>
  );
}

function DeckCard({
  index,
  active,
  deckPosition,
  dragX,
  exitDirection,
  onLayout,
  children,
}: {
  index: number;
  active: boolean;
  deckPosition: SharedValue<number>;
  dragX: SharedValue<number>;
  exitDirection: SharedValue<number>;
  onLayout: (event: LayoutChangeEvent) => void;
  children: ReactNode;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const depth = index - deckPosition.value;
    const departure = Math.min(Math.max(-depth, 0), 1);
    const dragProgress = Math.min(Math.abs(dragX.value) / EXIT_DISTANCE, 1);
    const behind = Math.min(Math.max(depth, 0), 1);
    const x = depth <= 0
      ? dragX.value + exitDirection.value * EXIT_DISTANCE * departure
      : 0;
    const opacity = depth < -1
      ? 0
      : depth < 0
      ? 1 - departure
      : Math.max(0, Math.min(2 - depth, 1)) *
        (1 - 0.35 * behind * (1 - dragProgress));

    return {
      opacity,
      transform: [
        { translateX: x },
        { translateY: 12 * behind * (1 - dragProgress) },
        { scale: 1 - 0.04 * behind * (1 - dragProgress) },
        { rotate: `${x / 24}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.deckCard, animatedStyle]}
      onLayout={onLayout}
      pointerEvents={active ? 'auto' : 'none'}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
    >
      {children}
    </Animated.View>
  );
}

function HabitCard({
  item,
  style,
}: {
  item: StarterPlanItem;
  style?: object;
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.icon, { backgroundColor: item.accent }]}>
        <OnboardingOptionIcon name={item.icon} size={42} color={colors.text.inverse} />
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.because != null ? (
        <Text style={styles.cardReason}>{item.because}</Text>
      ) : (
        <Text style={styles.cardReason}>
          A small way to make your day feel more supported.
        </Text>
      )}
    </View>
  );
}

function ReviewCard({ onRestart }: { onRestart: () => void }) {
  return (
    <View style={styles.review}>
      <Text style={styles.reviewTitle}>Your choices are ready.</Text>
      <Text style={styles.reviewCopy}>
        Review your choices or continue to your routine.
      </Text>
      <ChunkyButton
        label="Edit choices"
        tone={CHUNKY_TONE_SOFT}
        onPress={onRestart}
        haptic="tap"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  deck: {
    minHeight: 335,
    justifyContent: 'center',
  },
  cardStack: {
    minHeight: 300,
  },
  deckCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  card: {
    ...card.paper,
    minHeight: 300,
    padding: spacing.xl,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    alignSelf: 'center',
  },
  cardTitle: {
    ...typography.title.title2,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  cardReason: {
    ...typography.body.large,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  swipeGuide: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  swipeGuideItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  swipeGuideLabel: {
    ...typography.label.detail,
    color: colors.text.tertiary,
    flexShrink: 1,
  },
  swipeGuideRight: {
    justifyContent: 'flex-end',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footer: {
    minHeight: 80,
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
  },
  review: {
    ...card.paper,
    minHeight: 300,
    padding: spacing.xl,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    justifyContent: 'center',
    gap: spacing.md,
  },
  reviewTitle: {
    ...typography.title.title2,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  reviewCopy: {
    ...typography.body.large,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
