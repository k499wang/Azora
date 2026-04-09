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
import ExercisePicker from '../components/exercise/ExercisePicker';
import TECHNIQUES from '../data/techniques';
import type { BreathingTechnique } from '../data/techniques';

const MIN_ROUNDS = 1;
const MAX_ROUNDS = 20;

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

  const [technique, setTechnique] = useState<BreathingTechnique>(TECHNIQUES[0]);
  const [totalRounds, setTotalRounds] = useState(TECHNIQUES[0].defaultRounds);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const runPhase = useCallback(
    (p: Phase, secs: number, onDone: () => void) => {
      if (secs === 0) {
        onDone();
        return;
      }
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
    (currentRound: number, pattern: BreathingTechnique['pattern'], rounds: number) => {
      if (currentRound > rounds) {
        setPhase('done');
        return;
      }
      setRound(currentRound);

      runPhase('inhale', pattern.inhale, () => {
        runPhase('holdIn', pattern.holdIn, () => {
          runPhase('exhale', pattern.exhale, () => {
            runPhase('holdOut', pattern.holdOut, () => {
              startCycle(currentRound + 1, pattern, rounds);
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
      startCycle(1, technique.pattern, totalRounds);
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

  const handleTechniqueSelect = (t: BreathingTechnique) => {
    if (phase !== 'idle' && phase !== 'done') return;
    setTechnique(t);
    setTotalRounds(t.defaultRounds);
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
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Exercise</Text>
          <View style={styles.headerRight}>
            <View style={isActive ? styles.hidden : undefined} pointerEvents={isActive ? 'none' : 'auto'}>
              <View style={styles.stepper}>
                <Pressable
                  style={[styles.stepBtn, totalRounds <= MIN_ROUNDS && styles.stepBtnDisabled]}
                  onPress={() => totalRounds > MIN_ROUNDS && setTotalRounds(totalRounds - 1)}
                >
                  <MaterialCommunityIcons
                    name="minus"
                    size={14}
                    color={totalRounds <= MIN_ROUNDS ? colors.text.tertiary : colors.text.primary}
                  />
                </Pressable>
                <View style={styles.stepValueWrap}>
                  <Text style={styles.stepValue}>{totalRounds}</Text>
                  <Text style={styles.stepLabel}>rounds</Text>
                </View>
                <Pressable
                  style={[styles.stepBtn, totalRounds >= MAX_ROUNDS && styles.stepBtnDisabled]}
                  onPress={() => totalRounds < MAX_ROUNDS && setTotalRounds(totalRounds + 1)}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={14}
                    color={totalRounds >= MAX_ROUNDS ? colors.text.tertiary : colors.text.primary}
                  />
                </Pressable>
              </View>
            </View>
            {isActive ? (
              <Pressable onPress={handleReset} style={styles.resetButton}>
                <MaterialCommunityIcons name="close" size={20} color={colors.text.secondary} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={isActive ? styles.hidden : undefined} pointerEvents={isActive ? 'none' : 'auto'}>
          <ExercisePicker techniques={TECHNIQUES} selected={technique.id} onSelect={handleTechniqueSelect} />
        </View>
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
                {round}/{totalRounds}
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
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: padding.screen.vertical,
    gap: spacing.sm,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    ...typography.title.title1,
    color: colors.text.primary,
  },
  headerRight: {
    position: 'relative',
  },
  resetButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: spacing.xl + spacing.xs,
    height: spacing.xl + spacing.xs,
    borderRadius: (spacing.xl + spacing.xs) / 2,
    backgroundColor: colors.neutral[100],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.elevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  stepValueWrap: {
    alignItems: 'center',
    minWidth: 26,
  },
  stepValue: {
    ...typography.heading.heading2,
    color: colors.text.primary,
  },
  stepLabel: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
  },
  hidden: {
    opacity: 0,
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
