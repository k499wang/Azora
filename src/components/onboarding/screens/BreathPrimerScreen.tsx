import { Text } from '../../common/Text';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Icon from '../../common/icons/Icon';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import BreathingCircle, {
  type BreathingCircleRef,
} from '../../../features/exercise/shared/components/BreathingCircle';
import { useBreathingPhaseRunner } from '../../../features/exercise/guidedBreathing/hooks/useBreathingPhaseRunner';
import type { BreathingPhase } from '../../../features/exercise/guidedBreathing/domain/breathingSessionTiming';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import ConfettiFall from '../ConfettiFall';

interface BreathPrimerScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

type Stage = 'intro' | 'guided' | 'done';

type PrimerPhase = 'inhale' | 'exhale';

const CYCLE_PHASES: { phase: PrimerPhase; seconds: number }[] = [
  { phase: 'inhale', seconds: 4 },
  { phase: 'exhale', seconds: 6 },
];

const CYCLES = 3;
const TOTAL_PHASES = CYCLE_PHASES.length * CYCLES;

const ENTER_MS = 700;
const COUNTDOWN_FROM = 3;
const COUNTDOWN_TICK_MS = 2400;
const COUNTDOWN_TOTAL_MS = ENTER_MS + COUNTDOWN_FROM * COUNTDOWN_TICK_MS;

// Each cue holds for exactly half the countdown, swapping on its own timer
// rather than on a numeral so the enter animation does not skew the split.
// One hand keeps the other free for the phone, and the second cue still
// works for anyone who cannot use a hand at all.
const COUNTDOWN_CUES = [
  'If you can, rest one hand on your belly.',
  'It should rise before your chest does.',
];

const PHASE_LABEL: Record<PrimerPhase, string> = {
  inhale: 'Inhale',
  exhale: 'Exhale',
};

// One cue per phase, gaining detail with each cycle.
const PHASE_CUES: Record<PrimerPhase, string[]> = {
  inhale: [
    'Inhale slowly through your nose, into your belly.',
    'Inhale and let your belly rise, not your chest.',
    'Inhale from the bottom up, belly before chest.',
  ],
  exhale: [
    'Exhale gently through your mouth, nice and slow.',
    'Exhale and let your belly sink back down.',
    'Exhale until empty, without rushing the end.',
  ],
};

const DONE_CUE = 'That is a full breath. Your belly leads, your chest follows.';

const windowHeight = Dimensions.get('window').height;

function countdownBeat() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export default function BreathPrimerScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  onSkip,
}: BreathPrimerScreenProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [phase, setPhase] = useState<PrimerPhase | null>(null);
  const [cycle, setCycle] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  const [countdownCue, setCountdownCue] = useState(0);

  const insets = useSafeAreaInsets();
  const circleRef = useRef<BreathingCircleRef | null>(null);
  const enter = useRef(new Animated.Value(0)).current;

  const { runPhase, cancel } = useBreathingPhaseRunner({
    circleRef,
    onPhaseChange: (next: BreathingPhase) =>
      setPhase(next === 'exhale' ? 'exhale' : 'inhale'),
  });

  const runFrom = useCallback(
    (index: number) => {
      if (index >= TOTAL_PHASES) {
        cancel();
        setPhase(null);
        setStage('done');
        if (isHapticsEnabled()) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
        }
        return;
      }
      const step = CYCLE_PHASES[index % CYCLE_PHASES.length];
      setCycle(Math.floor(index / CYCLE_PHASES.length));
      runPhase(step.phase, step.seconds, () => runFrom(index + 1));
    },
    [cancel, runPhase],
  );

  useEffect(() => {
    if (stage !== 'guided') return;
    enter.setValue(0);
    circleRef.current?.reset();
    Animated.timing(enter, {
      toValue: 1,
      duration: ENTER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setCountdown(COUNTDOWN_FROM);
    setCountdownCue(0);
    const cueSwap = setTimeout(
      () => setCountdownCue(1),
      COUNTDOWN_TOTAL_MS / 2,
    );
    const beats = Array.from({ length: COUNTDOWN_FROM }, (_, index) =>
      setTimeout(countdownBeat, ENTER_MS + index * COUNTDOWN_TICK_MS),
    );
    const ticks = Array.from({ length: COUNTDOWN_FROM }, (_, index) =>
      setTimeout(
        () => setCountdown(COUNTDOWN_FROM - index - 1),
        ENTER_MS + (index + 1) * COUNTDOWN_TICK_MS,
      ),
    );
    const startTimeout = setTimeout(() => runFrom(0), COUNTDOWN_TOTAL_MS);
    return () => {
      beats.forEach(clearTimeout);
      ticks.forEach(clearTimeout);
      clearTimeout(cueSwap);
      clearTimeout(startTimeout);
      enter.stopAnimation();
      cancel();
    };
    // runFrom is stable for the life of the stage; re-running would restart the cycles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  if (stage === 'guided' || stage === 'done') {
    const cueIndex = Math.min(cycle, PHASE_CUES.inhale.length - 1);
    const isDone = stage === 'done';

    return (
      <View style={styles.fullScreen}>
        <Animated.View
          style={[
            styles.fullCenter,
            {
              opacity: enter,
              transform: [
                {
                  scale: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.88, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <BreathingCircle ref={circleRef}>
            {isDone ? (
              <Icon name="check" size={34} color={colors.text.inverse} />
            ) : (
              <Text
                style={phase ? styles.phaseLabel : styles.countdownLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                maxFontSizeMultiplier={1.2}
              >
                {phase ? PHASE_LABEL[phase] : String(Math.max(countdown, 1))}
              </Text>
            )}
          </BreathingCircle>

          <View style={styles.cueSlot}>
            <Text style={styles.phaseCue}>
              {isDone
                ? DONE_CUE
                : phase
                  ? PHASE_CUES[phase][cueIndex]
                  : COUNTDOWN_CUES[countdownCue]}
            </Text>
          </View>
        </Animated.View>

        {isDone ? (
          <ConfettiFall
            count={70}
            spread={1}
            startTop={0}
            fallDistance={windowHeight + 80}
          />
        ) : null}

        {isDone ? (
          <View
            style={[
              styles.doneFooter,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <OnboardingPrimaryButton label="Continue" onPress={onContinue} />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onSkip ?? onContinue}
            hitSlop={12}
            style={({ pressed }) => [
              styles.guidedSkip,
              { top: insets.top + spacing.sm },
              pressed && styles.skipPressed,
            ]}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
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
        <View style={styles.introFooter}>
          <OnboardingPrimaryButton
            label="Try three breaths"
            onPress={() => setStage('guided')}
          />
          {onSkip ? (
            <Pressable
              accessibilityRole="button"
              onPress={onSkip}
              style={({ pressed }) => [styles.skip, pressed && styles.skipPressed]}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          ) : null}
        </View>
      }
    >
      <View style={styles.introStage}>
        <View style={styles.introIcon}>
          <Icon
            name="breath-profile"
            size={260}
            color={colors.primary.blue600}
          />
        </View>
        <View style={styles.introCopy}>
          <Text style={styles.introHeadline}>
            Let&apos;s learn how to{'\n'}breathe properly.
          </Text>
          <Text style={styles.introSub}>
            Next, follow the guided cues to inhale and exhale.
          </Text>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  introFooter: {
    gap: spacing.sm,
  },
  introStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  introIcon: {
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
  skip: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipPressed: {
    opacity: 0.6,
  },
  skipText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
  },

  fullScreen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  fullCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  phaseLabel: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 1.2,
    color: colors.neutral[50],
    textAlign: 'center',
  },
  guidedSkip: {
    position: 'absolute',
    right: spacing.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  doneFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
  },
  countdownLabel: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 34,
    lineHeight: 40,
    color: colors.neutral[50],
    textAlign: 'center',
  },
  cueSlot: {
    height: 100,
    marginTop: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseCue: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 28,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
