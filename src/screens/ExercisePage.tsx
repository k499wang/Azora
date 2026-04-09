import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, padding } from '../theme/spacing';
import BreathingCircle, {
  BreathingCircleRef,
} from '../components/exercise/BreathingCircle';

const PATTERN = { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 };
const TOTAL_ROUNDS = 8;

type Phase = 'idle' | 'inhale' | 'holdIn' | 'exhale' | 'holdOut' | 'done';

const PHASE_LABELS: Record<Phase, string> = {
  idle: '',
  inhale: 'Breathe In',
  holdIn: 'Hold',
  exhale: 'Breathe Out',
  holdOut: 'Hold',
  done: 'Well done',
};

export default function ExercisePage() {
  const insets = useSafeAreaInsets();
  const circleRef = useRef<BreathingCircleRef>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [round, setRound] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const runPhase = useCallback(
    (p: Phase, secs: number, onDone: () => void) => {
      setPhase(p);
      setCountdown(secs);

      if (p === 'inhale') circleRef.current?.expand(secs);
      else if (p === 'exhale') circleRef.current?.contract(secs);

      let remaining = secs;
      clearTimer();
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        setElapsed((e) => e + 1);
        if (remaining <= 0) {
          clearTimer();
          onDone();
        }
      }, 1000);
    },
    [],
  );

  const startCycle = useCallback(
    (currentRound: number) => {
      if (currentRound > TOTAL_ROUNDS) {
        setPhase('done');
        return;
      }
      setRound(currentRound);

      runPhase('inhale', PATTERN.inhale, () => {
        runPhase('holdIn', PATTERN.holdIn, () => {
          runPhase('exhale', PATTERN.exhale, () => {
            runPhase('holdOut', PATTERN.holdOut, () => {
              startCycle(currentRound + 1);
            });
          });
        });
      });
    },
    [runPhase],
  );

  const handleStart = () => {
    if (phase === 'idle' || phase === 'done') {
      setElapsed(0);
      circleRef.current?.reset();
      startCycle(1);
    }
  };

  const handleReset = () => {
    clearTimer();
    circleRef.current?.reset();
    setPhase('idle');
    setCountdown(0);
    setRound(0);
    setElapsed(0);
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isActive = phase !== 'idle' && phase !== 'done';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.technique}>Box Breathing</Text>
          <Text style={styles.pattern}>
            {PATTERN.inhale}-{PATTERN.holdIn}-{PATTERN.exhale}-{PATTERN.holdOut}
          </Text>
        </View>
        {isActive ? (
          <Pressable onPress={handleReset} style={styles.resetButton}>
            <MaterialCommunityIcons name="close" size={20} color={colors.text.secondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Center */}
      <View style={styles.center}>
        <BreathingCircle ref={circleRef}>
          <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
          {isActive ? (
            <Text style={styles.countdown}>{countdown}</Text>
          ) : null}
          {phase === 'done' ? (
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={32}
              color={colors.primary.blue100}
            />
          ) : null}
        </BreathingCircle>
      </View>

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        {isActive ? (
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Round</Text>
              <Text style={styles.statValue}>
                {round}/{TOTAL_ROUNDS}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Elapsed</Text>
              <Text style={styles.statValue}>{formatTime(elapsed)}</Text>
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed,
            ]}
            onPress={handleStart}
          >
            <Text style={styles.startButtonText}>
              {phase === 'done' ? 'Restart' : 'Begin Session'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: padding.screen.vertical,
  },
  technique: {
    ...typography.title.title1,
    color: colors.text.primary,
  },
  pattern: {
    ...typography.body.small,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  resetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    ...typography.title.title3,
    color: colors.text.inverse,
  },
  countdown: {
    ...typography.display.display1,
    color: colors.text.inverse,
  },
  bottom: {
    paddingHorizontal: padding.screen.horizontal,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
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
    height: 28,
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
