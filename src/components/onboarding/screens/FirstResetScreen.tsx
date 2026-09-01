import { Text } from '../../common/Text';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { padding, spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { triggerCelebrationHaptic } from '../../../native/tapHaptics';
import ConfettiFall from '../ConfettiFall';
import FirstResetMoodModal from '../FirstResetMoodModal';
import type { BreathingCircleRef } from '../../../features/exercise/shared/components/BreathingCircle';
import BreathingCompanion from '../../../features/exercise/shared/components/BreathingCompanion';
import type { BreathFace } from '../../../features/exercise/shared/components/breathFaces';
import { usePhaseCrossfade } from '../../../features/exercise/shared/hooks/usePhaseCrossfade';
import { EXERCISE_DARK_THEMES } from '../../../theme/exerciseDarkThemes';
import {
  useBreathingPhaseRunner,
  type BreathingPhase,
} from '../../../features/exercise/guidedBreathing/hooks/useBreathingPhaseRunner';
import { useGuidedBreathingFlow } from '../../../features/exercise/guidedBreathing/hooks/useGuidedBreathingFlow';
import { requireTechnique } from '../../../features/exercise/guidedBreathing/techniques';
import type { TechniqueId } from '../../../features/exercise/guidedBreathing/techniqueCatalog';
import { firstResetRounds } from '../../../lib/onboardingFirstReset';
import type { OnboardingMood } from '../types';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface FirstResetScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: (mood: OnboardingMood | null) => void;
  onBack: () => void;
  onSkip?: () => void;
}

type Phase = 'intro' | 'leadIn' | 'session' | 'completion' | 'done';
type CuePhase = BreathingPhase | 'done';
type DisplayCuePhase = CuePhase | 'leadIn';

const CUE_TEXT: Record<CuePhase, string> = {
  inhale: 'Inhale',
  holdIn: 'Hold',
  exhale: 'Exhale',
  holdOut: 'Hold',
  done: 'Done!',
};

const PHASE_FACE: Record<BreathingPhase, BreathFace> = {
  inhale: 'inhale',
  holdIn: 'holdIn',
  exhale: 'exhale',
  holdOut: 'holdOut',
};

/**
 * Onboarding has no theme preference to read yet, so the companion runs on the
 * light theme the rest of onboarding is drawn on.
 */
const THEME = EXERCISE_DARK_THEMES[0];

/** The session counts the seconds left in the phase rather than the rounds. */
const ignoreRoundChange = () => {};

/** seconds of "ready?" before the first cue, so it never starts under him */
const LEAD_IN_SECONDS = 3;

/** Gives the final cue time to crossfade in and remain readable. */
const COMPLETION_MS = 1200;

/** Lets the falling celebration establish itself before the question appears. */
const MOOD_PROMPT_MS = 1400;

/**
 * Fixed rather than matched to the user's goal: the first reset is the gentlest
 * introduction we have — an even in-and-out with no held breath in it — and
 * every goal is better served by finishing one than by starting the right one.
 */
const FIRST_RESET_TECHNIQUE_ID: TechniqueId = 'relaxing';

export default function FirstResetScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  onSkip,
}: FirstResetScreenProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [breathPhase, setBreathPhase] = useState<BreathingPhase>('inhale');
  const [count, setCount] = useState(LEAD_IN_SECONDS);
  const [isMoodModalVisible, setIsMoodModalVisible] = useState(false);

  const technique = requireTechnique(FIRST_RESET_TECHNIQUE_ID);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const circleRef = useRef<BreathingCircleRef | null>(null);
  const phaseRef = useRef<Phase>('intro');
  const stageEnter = useRef(new Animated.Value(0)).current;

  const rounds = firstResetRounds(technique.pattern, technique.defaultRounds);
  const cuePhase: DisplayCuePhase =
    phase === 'intro' || phase === 'leadIn'
      ? 'leadIn'
      : phase === 'completion' || phase === 'done'
        ? 'done'
        : breathPhase;
  const { displayPhase: displayCuePhase, opacity: cueOpacity } =
    usePhaseCrossfade(cuePhase, {
      fadeKey: cuePhase === 'leadIn' ? 'leadIn' : CUE_TEXT[cuePhase],
    });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const { runPhase, getElapsedSeconds, remainingSeconds, resetElapsed, cancel } =
    useBreathingPhaseRunner({
      circleRef,
      onPhaseChange: setBreathPhase,
    });

  // Read through a ref rather than `phase` so the session callback stays stable
  // for the lifetime of the run: it is what stops a re-render restarting it.
  const isActive = useCallback(() => phaseRef.current === 'session', []);

  const runSession = useGuidedBreathingFlow({
    isActive,
    runPhase,
    getElapsedSeconds,
    onRoundChange: ignoreRoundChange,
    onComplete: () => setPhase('completion'),
  });

  useEffect(() => {
    if (phase !== 'leadIn') return;

    stageEnter.setValue(0);
    Animated.timing(stageEnter, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    circleRef.current?.reset();

    const beat = () => {
      if (!isHapticsEnabled()) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    };

    let remaining = LEAD_IN_SECONDS;
    setCount(remaining);
    beat();

    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        setPhase('session');
        return;
      }
      setCount(remaining);
      beat();
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, stageEnter]);

  useEffect(() => {
    if (phase !== 'completion') return;

    const timer = setTimeout(() => setPhase('done'), COMPLETION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'done') return;

    triggerCelebrationHaptic();
    const timer = setTimeout(
      () => setIsMoodModalVisible(true),
      MOOD_PROMPT_MS,
    );

    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'session') return;

    setBreathPhase('inhale');
    resetElapsed();
    runSession(technique.pattern, rounds);

    return () => cancel();
  }, [cancel, phase, resetElapsed, rounds, runSession, technique.pattern]);

  if (
    phase === 'leadIn' ||
    phase === 'session' ||
    phase === 'completion' ||
    phase === 'done'
  ) {
    const isLeadIn = phase === 'leadIn';
    const isCompletion = phase === 'completion';
    const isDone = phase === 'done';
    const isDisplayingLeadIn = displayCuePhase === 'leadIn';
    const countdown =
      phase === 'session' &&
      !isDisplayingLeadIn &&
      displayCuePhase === breathPhase &&
      remainingSeconds > 0
        ? String(remainingSeconds)
        : '';

    return (
      <View
        style={[
          styles.fullScreen,
          // The companion measures its stage against the safe area, the same
          // way ExerciseScaffold hands it to the session screens.
          { backgroundColor: THEME.screen, paddingTop: insets.top },
        ]}
      >
        <Animated.View style={[styles.stage, { opacity: stageEnter }]}>
          <BreathingCompanion
            ref={circleRef}
            active
            face={
              isLeadIn || isCompletion || isDone
                ? 'resting'
                : PHASE_FACE[breathPhase]
            }
            theme={THEME}
            reducedMotion={reducedMotion}
            visible
          />

          {/*
            Above the companion rather than on it: the cue rides where the
            character's own motion is quietest, as it does in a real session.
          */}
          <View style={styles.topBlock} pointerEvents="none">
            <Animated.View style={[styles.cueBlock, { opacity: cueOpacity }]}>
              <Text
                style={[styles.cue, { color: THEME.textPrimary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {isDisplayingLeadIn ? count : CUE_TEXT[displayCuePhase]}
              </Text>
              {isDisplayingLeadIn ? null : (
                <Text
                  style={[styles.countdown, { color: THEME.textSecondary }]}
                >
                  {countdown === '' ? '\u00A0' : countdown}
                </Text>
              )}
            </Animated.View>
          </View>

          {onSkip && !isCompletion && !isDone ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip"
              hitSlop={12}
              onPress={() => {
                cancel();
                onSkip();
              }}
              style={({ pressed }) => [
                styles.stageSkip,
                pressed && styles.skipPressed,
              ]}
            >
              <Text style={[styles.skipText, { color: THEME.textSecondary }]}>
                Skip
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>

        {isDone ? (
          <>
            {reducedMotion ? null : (
              <ConfettiFall
                count={32}
                spread={0.9}
                startTop={0}
                fallDistance={height + 40}
              />
            )}

            <FirstResetMoodModal
              visible={isMoodModalVisible}
              onSelect={(mood) => {
                setIsMoodModalVisible(false);
                onContinue(mood);
              }}
            />
          </>
        ) : null}
      </View>
    );
  }

  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <OnboardingPrimaryButton
          label="Start"
          onPress={() => setPhase('leadIn')}
        />
      }
    >
      <View style={styles.introStage}>
        <View style={styles.techniqueIcon}>
          <MaterialCommunityIcons
            name={technique.icon}
            size={170}
            color={colors.primary.blue600}
          />
        </View>
        <View style={styles.introCopy}>
          <Text style={styles.introHeadline}>
            {'Let’s try your\nfirst exercise.'}
          </Text>
          <Text style={styles.introSub}>
            Let’s do a small breathing exercise together. It’ll take about a
            minute.
          </Text>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  introStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  techniqueIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCopy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  introHeadline: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.text.primary,
    textAlign: 'center',
  },
  introSub: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  // Sits in the same top-right slot the onboarding layout puts Skip in, so the
  // control does not move when the session takes the screen over.
  stageSkip: {
    position: 'absolute',
    top: spacing.sm,
    right: padding.screen.horizontal,
    paddingVertical: spacing.xs,
  },
  skipPressed: {
    opacity: 0.6,
  },
  skipText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  fullScreen: {
    flex: 1,
  },
  stage: {
    flex: 1,
  },
  topBlock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: spacing['2xl'],
    paddingHorizontal: padding.screen.horizontal,
  },
  cueBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  cue: {
    ...typography.display.display1,
    textAlign: 'center',
  },
  countdown: {
    ...typography.display.display2,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    textAlign: 'center',
  },
});
