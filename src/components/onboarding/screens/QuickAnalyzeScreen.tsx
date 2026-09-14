import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { AnimatedText, Text } from '../../common/Text';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { useSteppedProgress } from '../../../hooks/useSteppedProgress';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import { scaleVisual } from '../onboardingVisualScale';

/**
 * A single claim about the thing the user just answered questions about. One
 * per analyze screen, chosen by the call site so the fact lands on the block it
 * follows — a stress fact after the stress questions reads as a reply, the same
 * fact after the sleep questions reads as filler.
 */
export interface AnalyzeFact {
  /** The claim, in one sentence. */
  headline: string;
  /** What it means for them, in one sentence. */
  body: string;
  /** Sits at the right edge of the card, standing in for an illustration. */
  emoji: string;
}

interface QuickAnalyzeScreenProps {
  /** What is being read, in the user's terms. Constant for the whole run. */
  label: string;
  /**
   * How many legs the bar walks. Only the pacing and the ticks come from this —
   * the label above the bar does not change with it.
   */
  stepCount: number;
  durationMs: number;
  fact?: AnalyzeFact;
  onDone: () => void;
}

const HEADLINE = 'Analyzing your answers...';
/**
 * How long the full bar is held before the flow moves on. Just long enough for
 * the landing to register — the screen has already said what it read, and
 * sitting at 100% past that is dead time.
 */
const LANDED_HOLD_MS = 1000;
/**
 * The floor a run gets when it carries a fact — one short headline and one
 * short line, read once. A card the user is still mid-sentence on when the
 * screen leaves is worse than no card at all.
 */
const MIN_FACT_READ_MS = 3600;
const FACT_FADE_MS = 420;
const KOALA_WIDTH = scaleVisual(148);
/** The source art is taller than it is wide; keep its ratio so nothing squashes. */
const KOALA_HEIGHT = Math.round(KOALA_WIDTH * (934 / 870));
/** The same shallow lip the plan-loading card and the option rows sit on. */
const LIP_DEPTH = 3;

/**
 * The short analyze that sits between question blocks — the same machinery as
 * `PlanLoadingScreen` at a quarter of the size.
 */
export default function QuickAnalyzeScreen({
  label,
  stepCount,
  durationMs,
  fact,
  onDone,
}: QuickAnalyzeScreenProps) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const holdRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const factFade = useRef(new Animated.Value(0)).current;

  const { progress, percent } = useSteppedProgress({
    stepCount,
    totalDurationMs: fact
      ? Math.max(durationMs, MIN_FACT_READ_MS)
      : durationMs,
    handoffDelayMs: 0,
    // The last step is deliberately silent: its tick and the completion land
    // within a frame of each other, and two buzzes there read as one smudge
    // rather than as a finish.
    onStepComplete: (index) => {
      if (index >= stepCount - 1) return;
      if (isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    },
    onDone: () => {
      // The completion buzz: one clear success on the bar landing, every time.
      if (isHapticsEnabled()) {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
      }
      holdRef.current = setTimeout(() => onDoneRef.current(), LANDED_HOLD_MS);
    },
  });

  useEffect(() => {
    if (!fact) return undefined;
    // The card arrives just after the bar starts, so the eye goes to the run
    // first and finds the fact already there when it drops.
    const entrance = Animated.timing(factFade, {
      toValue: 1,
      duration: FACT_FADE_MS,
      delay: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    entrance.start();
    return () => entrance.stop();
  }, [fact, factFade]);

  useEffect(() => () => clearTimeout(holdRef.current), []);

  return (
    <OnboardingScreenLayout title="" footer={<View />}>
      <View style={styles.body}>
        <Image
          source={getOnboardingImageSource('azoAnalyzing')}
          style={styles.koala}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
        />

        <Text style={styles.headline}>{HEADLINE}</Text>

        <View style={styles.bars}>
          <View style={styles.barLabelRow}>
            <Text style={styles.barLabel}>{label}</Text>
            <Text style={styles.percent}>{percent}%</Text>
          </View>

          <View style={styles.track}>
            <Animated.View
              style={[
                styles.fill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {fact ? (
          <Animated.View
            style={[
              card.base,
              styles.factCard,
              {
                opacity: factFade,
                transform: [
                  {
                    translateY: factFade.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.factText}>
              <AnimatedText style={styles.factHeadline}>
                {fact.headline}
              </AnimatedText>
              <AnimatedText style={styles.factBody}>{fact.body}</AnimatedText>
            </View>
            <AnimatedText style={styles.factEmoji}>{fact.emoji}</AnimatedText>
          </Animated.View>
        ) : null}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  // The whole screen is one small stack in the middle of the page: koala,
  // headline, bar, status. Anything looser reads as a screen with a gap in it
  // rather than as a moment that is about to pass.
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing['4xl'],
    gap: spacing.sm,
  },
  koala: {
    width: KOALA_WIDTH,
    height: KOALA_HEIGHT,
  },
  // The same size the layout gives every other onboarding screen's title, so
  // this reads as a step in the flow rather than as a caption under a picture.
  headline: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.4,
    textAlign: 'center',
    color: colors.text.primary,
  },
  bars: {
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  // Label and percentage read as one line: the thing being measured on the
  // left, how far it has got on the right, and the bar directly beneath both.
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  // Names what the run is reading. One line, fixed for the whole screen: text
  // that swaps under a three-second bar reads as flicker, not as progress.
  barLabel: {
    ...typography.body.medium,
    fontSize: 17,
    lineHeight: 23,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.primary.blue100,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue500,
  },
  percent: {
    ...typography.body.medium,
    fontSize: 17,
    lineHeight: 23,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  factCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing['2xl'],
    padding: spacing.lg,
    // the lip is a thicker bottom edge, so the extra depth comes out of the
    // padding rather than making the card taller than its siblings
    paddingBottom: spacing.lg - LIP_DEPTH,
    borderBottomWidth: LIP_DEPTH,
    borderBottomColor: colors.neutral[200],
  },
  factText: {
    flex: 1,
    gap: spacing.xs,
  },
  factHeadline: {
    ...typography.body.medium,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  factBody: {
    ...typography.body.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  factEmoji: {
    fontSize: 38,
    lineHeight: 44,
  },
});
