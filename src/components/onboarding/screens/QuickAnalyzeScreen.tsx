import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AnimatedText } from '../../common/Text';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { useSteppedProgress } from '../../../hooks/useSteppedProgress';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import { scaleVisual } from '../onboardingVisualScale';
import CalmKoala from '../../../../assets/Poses/koala_pose_calm.svg';

interface QuickAnalyzeScreenProps {
  /** One line per thing being read, in the user's terms. */
  steps: readonly string[];
  durationMs: number;
  onDone: () => void;
}

const HEADLINE = 'Analyzing your answers';
const LANDED_HEADLINE = 'Answers analyzed';
/**
 * How long the finished state is held once its text has faded in. Kept short:
 * the run itself is where the step lines are readable, and a long sit at 100%
 * is dead time on a screen that has already said what it found.
 */
const CONCLUSION_HOLD_MS = 1500;
/** Half a crossfade: the old line leaves, then the new one arrives. */
const TEXT_FADE_MS = 240;
const KOALA_SIZE = scaleVisual(148);

/**
 * The short analyze that sits between question blocks — the same machinery as
 * `PlanLoadingScreen` at a quarter of the size, with a conclusion instead of a
 * handoff so the pause visibly produced something.
 */
export default function QuickAnalyzeScreen({
  steps,
  durationMs,
  onDone,
}: QuickAnalyzeScreenProps) {
  const [landed, setLanded] = useState(false);
  // Trails `landed` by half a crossfade, so the text swaps while it is invisible.
  const [showLanded, setShowLanded] = useState(false);
  const textFade = useRef(new Animated.Value(1)).current;
  const percentOpacity = useRef(new Animated.Value(1)).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const { progress, percent, completedSteps } = useSteppedProgress({
    stepCount: steps.length,
    totalDurationMs: durationMs,
    handoffDelayMs: 0,
    // The last step is deliberately silent: its tick and the completion land
    // within a frame of each other, and two buzzes there read as one smudge
    // rather than as a finish.
    onStepComplete: (index) => {
      if (index >= steps.length - 1) return;
      if (isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    },
    onDone: () => setLanded(true),
  });

  useEffect(() => {
    if (!landed) return undefined;

    // The completion buzz: one clear success on the bar landing, every time.
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }

    // The percentage leaves for good once it reads 100 — the number has said
    // all it can, and the bar sitting full is what the hold is for.
    Animated.timing(percentOpacity, {
      toValue: 0,
      duration: TEXT_FADE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    let hold: ReturnType<typeof setTimeout>;
    const crossfade = Animated.timing(textFade, {
      toValue: 0,
      duration: TEXT_FADE_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });

    crossfade.start(({ finished }) => {
      if (!finished) return;
      setShowLanded(true);
      Animated.timing(textFade, {
        toValue: 1,
        duration: TEXT_FADE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      hold = setTimeout(() => onDoneRef.current(), CONCLUSION_HOLD_MS);
    });

    return () => {
      crossfade.stop();
      clearTimeout(hold);
    };
  }, [landed, textFade, percentOpacity]);

  const statusIndex = Math.min(completedSteps, steps.length - 1);

  return (
    <OnboardingScreenLayout title="" footer={<View />}>
      <View style={styles.body}>
        <View style={styles.stage}>
          <CalmKoala width={KOALA_SIZE} height={KOALA_SIZE} />
        </View>

        <AnimatedText style={[styles.headline, { opacity: textFade }]}>
          {showLanded ? LANDED_HEADLINE : HEADLINE}
        </AnimatedText>

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

        <AnimatedText style={[styles.status, { opacity: textFade }]}>
          {showLanded ? 'Done' : steps[statusIndex]}
        </AnimatedText>

        <AnimatedText style={[styles.percent, { opacity: percentOpacity }]}>
          {percent}%
        </AnimatedText>
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
  stage: {
    alignItems: 'center',
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
  track: {
    width: '100%',
    maxWidth: scaleVisual(240),
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.primary.blue100,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue500,
  },
  status: {
    ...typography.body.small,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  percent: {
    ...typography.caption.caption1,
    textAlign: 'center',
    color: colors.text.tertiary,
  },
});
