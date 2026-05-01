import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing } from '../theme/spacing';
import BreathingCircle, {
  BreathingCircleRef,
} from '../components/exercise/BreathingCircle';
import ExerciseScaffold from '../components/exercise/ExerciseScaffold';
import TECHNIQUES from '../data/techniques';
import type { BreathingTechnique } from '../data/techniques';
import { useLivePulse } from '../hooks/useLivePulse';
import { LiveHeartRateMonitor } from '../components/meditation/LiveHeartRateMonitor';
import { PersistentCameraRing } from '../components/heartRate/PersistentCameraRing';
import type { FingerPlacementState } from '../lib/heartRate/types';
import { usePostHog } from 'posthog-react-native';
import type { ExerciseSessionScreenProps } from '../app/navigation';
import { captureException } from '../services/analytics/errorTracking';
import { AnalyticsEvent } from '../services/analytics/events';

const MIN_ROUNDS = 1;
const MAX_ROUNDS = 20;
const PLACEMENT_GOOD_DURATION_MS = 1500;
const PLACEMENT_TIMEOUT_SECONDS = 10;
const PLACEMENT_RING_SIZE = 240;

interface PreviewFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

function placementConfig(p: FingerPlacementState): { ringColor: string; status: string } {
  switch (p) {
    case 'good':
      return { ringColor: colors.success[500], status: 'Hold still…' };
    case 'partial':
      return { ringColor: colors.warning[500], status: 'Cover the lens fully' };
    case 'too_much_pressure':
      return { ringColor: '#8B5CF6', status: 'Ease up slightly' };
    case 'no_finger':
    case 'lost':
    default:
      return { ringColor: colors.error[500], status: 'Place your fingertip over the camera' };
  }
}

type Phase =
  | 'idle'
  | 'placement'
  | 'inhale'
  | 'holdIn'
  | 'exhale'
  | 'holdOut'
  | 'done';

const PHASE_LABELS: Record<Phase, string> = {
  idle: '',
  placement: '',
  inhale: 'Inhale',
  holdIn: 'Hold',
  exhale: 'Exhale',
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
  const [hrEnabled, setHrEnabled] = useState(true);
  const [previewFrame, setPreviewFrame] = useState<PreviewFrame | null>(null);

  const posthog = usePostHog();

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
    try {
      if (hrEnabled) {
        setHrEnabled(false);
        posthog.capture(AnalyticsEvent.HeartRateMonitoringToggled, {
          enabled: false,
          technique_id: technique.id,
          technique_name: technique.name,
        });
        return;
      }
      const granted = hasPermission ? true : await requestPermission();
      if (granted) {
        setHrEnabled(true);
        posthog.capture(AnalyticsEvent.HeartRateMonitoringToggled, {
          enabled: true,
          technique_id: technique.id,
          technique_name: technique.name,
        });
      }
    } catch (error) {
      captureException(error, {
        flow: 'exercise_session',
        action: 'toggle_heart_rate',
        screen_name: 'ExerciseSession',
        technique_id: technique.id,
        technique_name: technique.name,
      });
    }
  }, [hrEnabled, hasPermission, requestPermission, posthog, technique]);

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

      if (p === 'inhale' || p === 'exhale') {
        // Defer to the next frame: on the first phase, BreathingCircle
        // mounts in the same render that flips off the placement UI, so
        // circleRef is still null when runPhase fires.
        requestAnimationFrame(() => {
          if (p === 'inhale') circleRef.current?.expand(secs);
          else circleRef.current?.contract(secs);
        });
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
        posthog.capture(AnalyticsEvent.ExerciseSessionCompleted, {
          technique_id: technique.id,
          technique_name: technique.name,
          technique_category: technique.category,
          total_rounds: rounds,
          elapsed_seconds: elapsed,
          hr_monitoring_enabled: hrEnabled,
        });
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
    [runPhase, posthog, technique, elapsed, hrEnabled],
  );

  const handlePause = () => {
    clearTimer();
    circleRef.current?.pause();
    setPaused(true);
    posthog.capture(AnalyticsEvent.ExerciseSessionPaused, {
      technique_id: technique.id,
      technique_name: technique.name,
      round,
      total_rounds: totalRounds,
      elapsed_seconds: elapsed,
    });
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

  const beginExercise = useCallback(
    (withHr: boolean) => {
      setElapsed(0);
      setCountdown(0);
      setRound(0);
      requestAnimationFrame(() => circleRef.current?.reset());
      posthog.capture(AnalyticsEvent.ExerciseSessionStarted, {
        technique_id: technique.id,
        technique_name: technique.name,
        technique_category: technique.category,
        total_rounds: totalRounds,
        hr_monitoring_enabled: withHr,
      });
      startCycle(1, technique.pattern, totalRounds);
    },
    [posthog, technique, totalRounds, startCycle],
  );

  const startPlacement = useCallback(async () => {
    try {
      const granted = hasPermission ? true : await requestPermission();
      if (!granted) {
        setHrEnabled(false);
        beginExercise(false);
        return;
      }
      setHrEnabled(true);
      setPhase('placement');
      startPulse();
    } catch (error) {
      captureException(error, {
        flow: 'exercise_session',
        action: 'start_placement',
        screen_name: 'ExerciseSession',
        technique_id: technique.id,
        technique_name: technique.name,
      });
      setHrEnabled(false);
      beginExercise(false);
    }
  }, [hasPermission, requestPermission, startPulse, beginExercise, technique]);

  const handleStart = () => {
    if (phase === 'idle' || phase === 'done') {
      void startPlacement();
    }
  };

  useEffect(() => {
    if (phase !== 'placement') return;
    if (pulse.fingerPlacement !== 'good') return;
    const t = setTimeout(() => {
      beginExercise(true);
    }, PLACEMENT_GOOD_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase, pulse.fingerPlacement, beginExercise]);

  const [placementHoldProgress, setPlacementHoldProgress] = useState(0);
  useEffect(() => {
    if (phase !== 'placement' || pulse.fingerPlacement !== 'good') {
      setPlacementHoldProgress(0);
      return;
    }
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsedMs = Date.now() - start;
      const next = Math.min(1, elapsedMs / PLACEMENT_GOOD_DURATION_MS);
      setPlacementHoldProgress(next);
      if (next < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, pulse.fingerPlacement]);

  const [showStartAnyway, setShowStartAnyway] = useState(false);
  useEffect(() => {
    if (phase !== 'placement') {
      setShowStartAnyway(false);
      return;
    }
    const t = setTimeout(() => setShowStartAnyway(true), PLACEMENT_TIMEOUT_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [phase]);

  const handleClose = () => {
    clearTimer();
    stopPulse();
    if (phase !== 'idle' && phase !== 'done') {
      const cycleSeconds =
        technique.pattern.inhale +
        technique.pattern.holdIn +
        technique.pattern.exhale +
        technique.pattern.holdOut;
      const targetSeconds = cycleSeconds * totalRounds;
      posthog.capture(AnalyticsEvent.ExerciseSessionAbandoned, {
        technique_id: technique.id,
        technique_name: technique.name,
        abandoned_at_phase: phase,
        abandoned_at_round: round,
        total_rounds: totalRounds,
        elapsed_seconds: elapsed,
        target_seconds: targetSeconds,
        completion_rate: targetSeconds > 0 ? elapsed / targetSeconds : 0,
      });
    }
    navigation.goBack();
  };

  useEffect(() => () => clearTimer(), []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isActive =
    phase !== 'idle' && phase !== 'done' && phase !== 'placement';

  const cycleSeconds =
    technique.pattern.inhale +
    technique.pattern.holdIn +
    technique.pattern.exhale +
    technique.pattern.holdOut;
  const totalSeconds = Math.max(1, cycleSeconds * totalRounds);
  const progress = Math.min(
    1,
    phase === 'done' ? 1 : elapsed / totalSeconds,
  );

  const isPlacement = phase === 'placement';
  const placementCfg = placementConfig(pulse.fingerPlacement);
  const pillPreviewStyle = !isPlacement && pulse.active && previewFrame != null
    ? [
        styles.persistentCameraPillPreview,
        {
          top: previewFrame.y - (PLACEMENT_RING_SIZE - previewFrame.height) / 2,
          left: previewFrame.x - (PLACEMENT_RING_SIZE - previewFrame.width) / 2,
        },
      ]
    : null;
  const cameraProps = useMemo(() => (
    pulse.device != null
      ? {
          device: pulse.device,
          format: pulse.format,
          frameProcessor: pulse.frameProcessor,
          torchMode: pulse.torchMode,
          isActive: pulse.active,
        }
      : undefined
  ), [pulse.active, pulse.device, pulse.format, pulse.frameProcessor, pulse.torchMode]);

  return (
    <View style={styles.fill}>
      {isPlacement ? (
        <View style={styles.placementContainer}>
          <View style={styles.placementTopArea}>
            <Text style={[styles.placementStatus, { color: placementCfg.ringColor }]}>
              {placementCfg.status}
            </Text>
          </View>

          <View style={styles.placementRingSlot} pointerEvents="none" />

          <View style={styles.placementBottomArea}>
            {showStartAnyway && (
              <TouchableOpacity
                style={styles.startAnywayButton}
                onPress={() => beginExercise(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.startAnywayText}>Start Anyway</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                stopPulse();
                navigation.goBack();
              }}
              activeOpacity={0.7}
              style={styles.placementCancelTouchable}
            >
              <Text style={styles.placementCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ExerciseScaffold
      titleSlot={
        <View style={styles.titleSlotWrap}>
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
              mountCamera={false}
              showCameraPreview={true}
              onPreviewFrame={setPreviewFrame}
            />
          ) : null}
        </View>
        </View>
      }
      centerSlot={
        <BreathingCircle ref={circleRef}>
          <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
          {phase === 'done' ? (
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={32}
              color={colors.neutral[50]}
            />
          ) : null}
        </BreathingCircle>
      }
      bottomSlot={
        <View style={styles.bottomContainer}>
          {isActive || paused ? (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressLabel}>
                Round {Math.min(round, totalRounds)} of {totalRounds}
              </Text>
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
      )}
      <View
        pointerEvents="none"
        style={[
          styles.persistentCamera,
          isPlacement
            ? styles.persistentCameraVisible
            : pillPreviewStyle
              ? pillPreviewStyle
              : styles.persistentCameraHidden,
        ]}
      >
        <PersistentCameraRing
          ringColor={isPlacement ? placementCfg.ringColor : colors.primary.blue600}
          trackColor={isPlacement ? placementCfg.ringColor + '33' : colors.border.subtle}
          progress={isPlacement ? placementHoldProgress : 0}
          cameraProps={cameraProps}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  persistentCamera: {
    position: 'absolute',
    zIndex: 0,
  },
  persistentCameraVisible: {
    top: '50%',
    left: '50%',
    width: PLACEMENT_RING_SIZE,
    height: PLACEMENT_RING_SIZE,
    marginTop: -PLACEMENT_RING_SIZE / 2,
    marginLeft: -PLACEMENT_RING_SIZE / 2,
    opacity: 1,
  },
  persistentCameraHidden: {
    top: 0,
    left: 0,
    width: PLACEMENT_RING_SIZE,
    height: PLACEMENT_RING_SIZE,
    opacity: 0,
    transform: [{ scale: 0.01 }],
  },
  persistentCameraPillPreview: {
    width: PLACEMENT_RING_SIZE,
    height: PLACEMENT_RING_SIZE,
    opacity: 1,
    zIndex: 100,
    elevation: 100,
    transform: [{ scale: 20 / PLACEMENT_RING_SIZE }],
  },
  placementContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  placementTopArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing['6xl'],
    zIndex: 2,
  },
  placementRingSlot: {
    width: PLACEMENT_RING_SIZE,
    height: PLACEMENT_RING_SIZE,
  },
  placementBottomArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xl,
    gap: spacing.sm,
    zIndex: 2,
  },
  placementStatus: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  startAnywayButton: {
    width: '100%',
    backgroundColor: colors.primary.blue600,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startAnywayText: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  placementCancelTouchable: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  placementCancelText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  titleSlotWrap: {
    alignItems: 'center',
    gap: spacing.sm,
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
  bottomContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  progressWrap: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.blue500,
    borderRadius: 4,
  },
  progressLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
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
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 32,
    lineHeight: 40,
    color: colors.neutral[50],
    textAlign: 'center',
  },
});
