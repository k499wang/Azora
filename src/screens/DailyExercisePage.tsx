import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import BreathingCircle, {
  BreathingCircleRef,
} from '../components/exercise/BreathingCircle';
import ExerciseScaffold from '../components/exercise/ExerciseScaffold';

type HoldPhase = 'idle' | 'inhale' | 'hold' | 'done';

const PHASE_LABELS: Record<HoldPhase, string> = {
  idle: 'Daily Hold',
  inhale: 'Inhale',
  hold: 'Hold',
  done: 'Released',
};

export default function DailyExercisePage() {
  const navigation = useNavigation<any>();
  const circleRef = useRef<BreathingCircleRef>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [phase, setPhase] = useState<HoldPhase>('idle');
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [bestHoldSeconds, setBestHoldSeconds] = useState(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startInhale = () => {
    clearTimer();
    setHoldSeconds(0);
    setPhase('inhale');
    circleRef.current?.reset();
    circleRef.current?.expand(6);
  };

  const beginHold = () => {
    clearTimer();
    setHoldSeconds(0);
    setPhase('hold');
    timerRef.current = setInterval(() => {
      setHoldSeconds((current) => current + 1);
    }, 1000);
  };

  const releaseHold = () => {
    clearTimer();
    setBestHoldSeconds((current) => Math.max(current, holdSeconds));
    setPhase('done');
  };

  const handlePrimaryPress = () => {
    if (phase === 'idle' || phase === 'done') {
      startInhale();
      return;
    }

    if (phase === 'inhale') {
      beginHold();
      return;
    }

    releaseHold();
  };

  const resetSession = () => {
    clearTimer();
    circleRef.current?.reset();
    setPhase('idle');
    setHoldSeconds(0);
  };

  const primaryLabel =
    phase === 'idle'
      ? 'Start Inhale'
      : phase === 'inhale'
        ? 'Begin Hold'
        : phase === 'hold'
          ? 'Release'
          : 'Try Again';

  const guidance =
    phase === 'idle'
      ? 'Take one full breath in, then hold until you are ready to breathe.'
      : phase === 'inhale'
        ? 'Fill your lungs gently. Begin the hold when your inhale feels complete.'
        : phase === 'hold'
          ? 'Hold until you are ready to breathe. Release when it stops feeling controlled.'
          : 'Nice work. Rest for a moment, then begin again when you feel ready.';

  const displayTime = phase === 'hold' || phase === 'done' ? formatTime(holdSeconds) : null;

  return (
    <ExerciseScaffold
      title="Daily Exercise"
      subtitle="Inhale fully, begin your hold, then release when you are ready to breathe."
      onClose={() => {
        resetSession();
        navigation.goBack();
      }}
      centerSlot={
        <BreathingCircle ref={circleRef}>
          <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
          {displayTime ? <Text style={styles.countdown}>{displayTime}</Text> : null}
          {phase === 'done' ? (
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={32}
              color={colors.primary.blue100}
            />
          ) : null}
        </BreathingCircle>
      }
      bottomSlot={
        <>
          <Text style={styles.guidance}>{guidance}</Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Current hold</Text>
              <Text style={styles.statValue}>{formatTime(holdSeconds)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Best today</Text>
              <Text style={styles.statValue}>{formatTime(bestHoldSeconds)}</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
            onPress={handlePrimaryPress}
          >
            <Text style={styles.startButtonText}>{primaryLabel}</Text>
          </Pressable>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  phaseLabel: {
    ...typography.title.title3,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  countdown: {
    ...typography.display.display1,
    color: colors.text.inverse,
  },
  guidance: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  stat: {
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  statLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
  statValue: {
    ...typography.heading.heading1,
    color: colors.text.primary,
  },
  statDivider: {
    width: 1,
    height: spacing.lg + spacing.xs,
    backgroundColor: colors.border.subtle,
  },
  startButton: {
    backgroundColor: colors.primary.blue600,
    borderRadius: 18,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
    marginTop: spacing.lg,
  },
  startButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  startButtonText: {
    ...typography.button.large,
    color: colors.text.inverse,
  },
});
