import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import BreathingCircle, {
  BreathingCircleRef,
} from '../components/exercise/BreathingCircle';
import ExerciseScaffold from '../components/exercise/ExerciseScaffold';
import TECHNIQUES from '../data/techniques';
import type { BreathingTechnique } from '../data/techniques';
import { useLivePulse } from '../hooks/useLivePulse';
import { LiveHeartRateMonitor } from '../components/meditation/LiveHeartRateMonitor';
import type { ExerciseSessionScreenProps } from '../app/navigation';

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

export default function ExerciseSessionPage({
  navigation,
  route,
}: ExerciseSessionScreenProps) {
  const techniqueId = route.params?.techniqueId;
  const initialTechnique = TECHNIQUES.find((t) => t.id === techniqueId) ?? TECHNIQUES[0];

  const circleRef = useRef<BreathingCircleRef>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(0);
  const onDoneRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [round, setRound] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [technique] = useState<BreathingTechnique>(initialTechnique);
  const [totalRounds, setTotalRounds] = useState(initialTechnique.defaultRounds);
  const [hrEnabled, setHrEnabled] = useState(false);

  const pulse = useLivePulse();
  const { start: startPulse, stop: stopPulse, hasPermission, requestPermission } = pulse;

  // Depend on the derived boolean, not raw `phase`. Phase changes every few
  // seconds (inhale → holdIn → exhale → holdOut); if this effect re-ran on
  // every transition it would churn the camera stream and wipe BPM samples
  // before they could stabilize.
  const isSessionActive = phase !== 'idle' && phase !== 'done' && !paused;

  useEffect(() => {
    if (hrEnabled && isSessionActive) {
      startPulse();
    } else {
      stopPulse();
    }
  }, [hrEnabled, isSessionActive, startPulse, stopPulse]);

  const handleToggleHr = useCallback(async () => {
    if (hrEnabled) {
      setHrEnabled(false);
      return;
    }
    const granted = hasPermission ? true : await requestPermission();
    if (granted) setHrEnabled(true);
  }, [hrEnabled, hasPermission, requestPermission]);

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

      onDoneRef.current = onDone;
      setPhase(p);
      setCountdown(secs);
      setPaused(false);

      if (p === 'inhale') {
        circleRef.current?.expand(secs);
      } else if (p === 'exhale') {
        circleRef.current?.contract(secs);
      }

      let remaining = secs;
      remainingRef.current = remaining;
      clearTimer();
      timerRef.current = setInterval(() => {
        remaining -= 1;
        remainingRef.current = remaining;
        setCountdown(remaining);
        setElapsed((current) => current + 1);

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

  const handlePause = () => {
    clearTimer();
    circleRef.current?.pause();
    setPaused(true);
  };

  const handleResume = (currentPhase: Phase) => {
    if (!onDoneRef.current) return;
    const remaining = remainingRef.current;
    const onDone = onDoneRef.current;
    setPaused(false);

    if (currentPhase === 'inhale') {
      circleRef.current?.resumeExpand(remaining);
    } else if (currentPhase === 'exhale') {
      circleRef.current?.resumeContract(remaining);
    }

    let rem = remaining;
    clearTimer();
    timerRef.current = setInterval(() => {
      rem -= 1;
      remainingRef.current = rem;
      setCountdown(rem);
      setElapsed((current) => current + 1);
      if (rem <= 0) {
        clearTimer();
        onDone();
      }
    }, 1000);
  };

  const handleStart = () => {
    if (phase === 'idle' || phase === 'done') {
      setElapsed(0);
      setCountdown(0);
      setRound(0);
      circleRef.current?.reset();
      startCycle(1, technique.pattern, totalRounds);
    }
  };

  const handleClose = () => {
    clearTimer();
    stopPulse();
    navigation.goBack();
  };

  useEffect(() => () => clearTimer(), []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isActive = phase !== 'idle' && phase !== 'done';

  return (
    <ExerciseScaffold
      titleSlot={
        <View style={styles.titleSlotWrap}>
        <Text style={styles.techniqueSubtitle}>{technique.name}</Text>
        <View style={styles.hrRow}>
          <Pressable
            onPress={handleToggleHr}
            style={({ pressed }) => [
              styles.hrToggle,
              hrEnabled && styles.hrToggleOn,
              pressed && styles.hrTogglePressed,
            ]}
          >
            <MaterialCommunityIcons
              name={hrEnabled ? 'heart' : 'heart-outline'}
              size={14}
              color={hrEnabled ? colors.error[500] : colors.text.secondary}
            />
            <Text style={[styles.hrToggleText, hrEnabled && styles.hrToggleTextOn]}>
              {hrEnabled ? 'Heart rate on' : 'Track heart rate'}
            </Text>
          </Pressable>
          {pulse.active ? (
            <LiveHeartRateMonitor
              active={pulse.active}
              fingerPlacement={pulse.fingerPlacement}
              currentBpm={pulse.currentBpm}
              beatTick={pulse.beatTick}
              device={pulse.device}
              format={pulse.format}
              frameProcessor={pulse.frameProcessor}
              torchMode={pulse.torchMode}
            />
          ) : null}
        </View>
        <View style={styles.patternRow}>
          {(
            [
              { key: 'inhale', icon: 'arrow-up', label: 'Inhale', secs: technique.pattern.inhale },
              { key: 'holdIn', icon: 'dots-horizontal', label: 'Hold', secs: technique.pattern.holdIn },
              { key: 'exhale', icon: 'arrow-down', label: 'Exhale', secs: technique.pattern.exhale },
              { key: 'holdOut', icon: 'dots-horizontal', label: 'Hold', secs: technique.pattern.holdOut },
            ] as const
          )
            .filter((p) => p.secs > 0)
            .map((p, i, arr) => (
              <View key={p.key} style={styles.patternItem}>
                <View style={styles.patternCircle}>
                  <MaterialCommunityIcons name={p.icon} size={24} color={colors.text.secondary} />
                </View>
                <Text style={styles.patternSecs}>{p.secs}s</Text>
                {i < arr.length - 1 && (
                  <View style={styles.patternConnector} />
                )}
              </View>
            ))}
        </View>
        </View>
      }
      centerSlot={
        <BreathingCircle ref={circleRef}>
          <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
          {isActive ? <Text style={styles.countdown}>{countdown}</Text> : null}
          {phase === 'done' ? (
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={32}
              color={colors.primary.blue600}
            />
          ) : null}
        </BreathingCircle>
      }
      bottomSlot={
        <View style={styles.bottomContainer}>
          {isActive || paused ? (
            <View style={styles.roundCounter}>
              <Text style={styles.roundValue}>{round}<Text style={styles.roundTotal}>/{totalRounds}</Text></Text>
              <Text style={styles.roundLabel}>rounds</Text>
            </View>
          ) : (
            <View style={styles.stepper}>
              <Pressable
                style={[styles.stepBtn, totalRounds <= MIN_ROUNDS && styles.stepBtnDisabled]}
                onPress={() => totalRounds > MIN_ROUNDS && setTotalRounds(totalRounds - 1)}
              >
                <MaterialCommunityIcons name="minus" size={14} color={totalRounds <= MIN_ROUNDS ? colors.text.tertiary : colors.text.primary} />
              </Pressable>
              <View style={styles.stepValueWrap}>
                <Text style={styles.stepValue}>{totalRounds}</Text>
                <Text style={styles.stepLabel}>rounds</Text>
              </View>
              <Pressable
                style={[styles.stepBtn, totalRounds >= MAX_ROUNDS && styles.stepBtnDisabled]}
                onPress={() => totalRounds < MAX_ROUNDS && setTotalRounds(totalRounds + 1)}
              >
                <MaterialCommunityIcons name="plus" size={14} color={totalRounds >= MAX_ROUNDS ? colors.text.tertiary : colors.text.primary} />
              </Pressable>
            </View>
          )}
          <View style={styles.btnRow}>
            <Pressable style={({ pressed }) => [styles.squareBtn, pressed && styles.circleBtnPressed]} onPress={handleClose}>
              <MaterialCommunityIcons name="stop" size={26} color={colors.neutral[900]} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.circleBtn, pressed && styles.circleBtnPressed]}
              onPress={
                phase === 'idle' || phase === 'done'
                  ? handleStart
                  : paused
                    ? () => handleResume(phase)
                    : handlePause
              }
            >
              <MaterialCommunityIcons
                name={isActive && !paused ? 'pause' : 'play'}
                size={28}
                color={colors.neutral[900]}
              />
            </Pressable>
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  titleSlotWrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  techniqueSubtitle: {
    ...typography.title.title2,
    color: colors.text.primary,
  },
  hrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  hrToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.background.elevated,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  hrToggleOn: {
    borderColor: colors.error[500],
  },
  hrTogglePressed: {
    opacity: 0.7,
  },
  hrToggleText: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
  },
  hrToggleTextOn: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  patternItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  patternCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternSecs: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
  patternConnector: {
    position: 'absolute',
    top: 25,
    right: -spacing.sm,
    width: spacing.sm,
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  bottomContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  roundCounter: {
    alignItems: 'center',
  },
  roundValue: {
    ...typography.display.display2,
    color: colors.text.primary,
  },
  roundTotal: {
    ...typography.heading.heading1,
    color: colors.text.tertiary,
  },
  roundLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  squareBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  circleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  circleBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
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
  phaseLabel: {
    ...typography.title.title3,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  countdown: {
    ...typography.display.display1,
    color: colors.text.primary,
  },
});
