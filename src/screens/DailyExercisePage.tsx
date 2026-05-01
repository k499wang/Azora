import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing } from '../theme/spacing';
import BreathingCircle, {
  BreathingCircleRef,
} from '../components/exercise/BreathingCircle';
import ExerciseScaffold from '../components/exercise/ExerciseScaffold';
import { useLivePulse } from '../hooks/useLivePulse';
import { LiveHeartRateMonitor } from '../components/meditation/LiveHeartRateMonitor';
import { PersistentCameraRing } from '../components/heartRate/PersistentCameraRing';
import type { FingerPlacementState } from '../lib/heartRate/types';
import { usePostHog } from 'posthog-react-native';
import { AnalyticsEvent } from '../services/analytics/events';
import { captureException } from '../services/analytics/errorTracking';
import type { DailyExerciseScreenProps } from '../app/navigation';

const PLACEMENT_RING_SIZE = 240;
const PLACEMENT_TIMEOUT_SECONDS = 10;

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

type HoldPhase = 'idle' | 'placement' | 'inhale' | 'hold' | 'done';

const PHASE_LABELS: Record<HoldPhase, string> = {
  idle: 'Daily Hold',
  placement: 'Place finger',
  inhale: 'Inhale',
  hold: 'Hold',
  done: 'Released',
};

const PLACEMENT_GOOD_DURATION_MS = 1500;

interface BpmSample {
  t: number;
  bpm: number;
}

interface PreviewFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

const BEST_HOLD_KEY = 'daily_breath_hold_best_seconds';

function formatBest(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function DailyExercisePage({
  navigation,
}: DailyExerciseScreenProps) {
  const autoStartedRef = useRef(false);
  const posthog = usePostHog();
  const circleRef = useRef<BreathingCircleRef>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inhaleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const samplesRef = useRef<BpmSample[]>([]);
  const holdStartAtRef = useRef<number>(0);
  const [phase, setPhase] = useState<HoldPhase>('idle');
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [inhaleCountdown, setInhaleCountdown] = useState(0);
  const [bestHoldSeconds, setBestHoldSeconds] = useState(0);
  const [hrEnabled, setHrEnabled] = useState(true);
  const [lastSamples, setLastSamples] = useState<BpmSample[]>([]);
  const [isNewBest, setIsNewBest] = useState(false);
  const [previewFrame, setPreviewFrame] = useState<PreviewFrame | null>(null);

  const pulse = useLivePulse();
  const {
    start: startPulse,
    stop: stopPulse,
    hasPermission,
    requestPermission,
    currentBpm,
  } = pulse;

  const currentBpmRef = useRef<number | null>(null);
  useEffect(() => {
    currentBpmRef.current = currentBpm;
  }, [currentBpm]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(BEST_HOLD_KEY).then((raw) => {
      if (cancelled || raw == null) return;
      const stored = parseInt(raw, 10);
      if (Number.isFinite(stored) && stored > 0) setBestHoldSeconds(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (inhaleTimeoutRef.current) {
      clearTimeout(inhaleTimeoutRef.current);
      inhaleTimeoutRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clearTimer();
      stopPulse();
    },
    [stopPulse],
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const cancelPlacement = useCallback(() => {
    clearTimer();
    stopPulse();
    navigation.goBack();
  }, [navigation, stopPulse]);

  const beginHold = useCallback(() => {
    clearTimer();
    samplesRef.current = [];
    holdStartAtRef.current = Date.now();
    setHoldSeconds(0);
    setPhase('hold');
    circleRef.current?.pause();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    timerRef.current = setInterval(() => {
      setHoldSeconds((current) => {
        const next = current + 1;
        const bpm = currentBpmRef.current;
        if (bpm != null && Number.isFinite(bpm)) {
          samplesRef.current.push({ t: next, bpm });
        }
        return next;
      });
    }, 1000);
  }, []);

  const INHALE_SECONDS = 6;

  const startInhale = useCallback(() => {
    clearTimer();
    samplesRef.current = [];
    setLastSamples([]);
    setHoldSeconds(0);
    setIsNewBest(false);
    setPhase('inhale');
    setInhaleCountdown(INHALE_SECONDS);
    circleRef.current?.reset();
    circleRef.current?.expand(INHALE_SECONDS);
    if (hrEnabled) startPulse();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    posthog.capture(AnalyticsEvent.DailyBreathHoldStarted);
    timerRef.current = setInterval(() => {
      setInhaleCountdown((current) => {
        const next = current - 1;
        if (next <= 0) {
          clearTimer();
          beginHold();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [beginHold, hrEnabled, posthog, startPulse]);

  const startPlacement = useCallback(async () => {
    try {
      const granted = hasPermission ? true : await requestPermission();
      if (!granted) {
        setHrEnabled(false);
        startInhale();
        return;
      }
      setHrEnabled(true);
      setPhase('placement');
      startPulse();
    } catch (error) {
      captureException(error, {
        flow: 'daily_breath_hold',
        action: 'start_placement',
        screen_name: 'DailyExercise',
      });
      startInhale();
    }
  }, [hasPermission, requestPermission, startInhale, startPulse]);

  useEffect(() => {
    if (phase !== 'placement') return;
    if (pulse.fingerPlacement !== 'good') return;
    const t = setTimeout(() => {
      startInhale();
    }, PLACEMENT_GOOD_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase, pulse.fingerPlacement, startInhale]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    void startPlacement();
  }, [startPlacement]);

  const skipInhale = () => {
    if (phase !== 'inhale') return;
    clearTimer();
    setInhaleCountdown(0);
    beginHold();
  };

  const releaseHold = () => {
    clearTimer();
    const samples = samplesRef.current.slice();
    setLastSamples(samples);
    const newBest = holdSeconds > bestHoldSeconds && holdSeconds > 0;
    const updatedBest = Math.max(bestHoldSeconds, holdSeconds);
    setBestHoldSeconds(updatedBest);
    setIsNewBest(newBest);
    setPhase('done');
    stopPulse();
    if (newBest) {
      AsyncStorage.setItem(BEST_HOLD_KEY, String(updatedBest)).catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    posthog.capture(AnalyticsEvent.DailyBreathHoldReleased, {
      hold_seconds: holdSeconds,
      best_hold_seconds: updatedBest,
      is_new_best: newBest,
      hr_monitoring_enabled: hrEnabled,
      bpm_sample_count: samples.length,
    });
  };

  const HOLD_RELEASE_GUARD_MS = 1000;

  const tryReleaseHold = () => {
    if (phase !== 'hold') return;
    if (Date.now() - holdStartAtRef.current < HOLD_RELEASE_GUARD_MS) return;
    releaseHold();
  };

  const handleCirclePress = () => {
    if (phase === 'inhale') {
      skipInhale();
      return;
    }
    if (phase === 'hold') {
      tryReleaseHold();
    }
  };

  const handlePrimaryPress = () => {
    if (phase === 'idle' || phase === 'done') {
      void startPlacement();
      return;
    }
    if (phase === 'inhale') {
      skipInhale();
      return;
    }
    if (phase === 'hold') {
      tryReleaseHold();
    }
  };

  const handleViewResults = () => {
    const samples = lastSamples;
    const bpms = samples.map((s) => s.bpm);
    const avgBpm = bpms.length
      ? Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length)
      : undefined;
    const minBpm = bpms.length ? Math.min(...bpms) : undefined;
    const maxBpm = bpms.length ? Math.max(...bpms) : undefined;

    posthog.capture(AnalyticsEvent.DailyResultsViewed, {
      hold_seconds: holdSeconds,
      best_hold_seconds: bestHoldSeconds,
      avg_bpm: avgBpm ?? null,
      min_bpm: minBpm ?? null,
      max_bpm: maxBpm ?? null,
    });
    navigation.navigate('DailyResult', {
      holdSeconds,
      bpmSamples: samples,
      avgBpm,
      minBpm,
      maxBpm,
    });
  };

  const primaryLabel =
    phase === 'idle'
      ? 'Start'
      : phase === 'inhale'
        ? 'Skip'
        : phase === 'hold'
          ? 'Release'
          : 'Try Again';

  const guidance =
    phase === 'idle'
      ? 'Take one full breath in, then hold until you are ready to breathe.'
      : phase === 'hold'
        ? 'Tap the circle when you need to breathe.'
        : phase === 'done'
          ? 'Nice work. Rest for a moment, then begin again when you feel ready.'
          : '';

  const displayTime = phase === 'hold' || phase === 'done' ? formatTime(holdSeconds) : null;

  // Placement state: hold-steady arc + start-anyway timeout
  const [placementHoldProgress, setPlacementHoldProgress] = useState(0);
  useEffect(() => {
    if (phase !== 'placement' || pulse.fingerPlacement !== 'good') {
      setPlacementHoldProgress(0);
      return;
    }
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / PLACEMENT_GOOD_DURATION_MS);
      setPlacementHoldProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
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

  const placementCfg = placementConfig(pulse.fingerPlacement);
  const isPlacement = phase === 'placement';
  const pillPreviewStyle = !isPlacement && pulse.active && previewFrame != null
    ? [
        styles.persistentCameraPillPreview,
        {
          top: previewFrame.y - (PLACEMENT_RING_SIZE - previewFrame.height) / 2,
          left: previewFrame.x - (PLACEMENT_RING_SIZE - previewFrame.width) / 2,
        },
      ]
    : null;
  const cameraProps = pulse.device != null
    ? {
        device: pulse.device,
        format: pulse.format,
        frameProcessor: pulse.frameProcessor,
        torchMode: pulse.torchMode,
        isActive: pulse.active,
      }
    : undefined;

  return (
    <View style={styles.fill}>
      {isPlacement ? (
        <SafeAreaView style={styles.placementSafeArea}>
        <View style={styles.placementContainer}>
          <View style={styles.placementTopArea}>
            <Text style={[styles.placementStatus, { color: placementCfg.ringColor }]}>
              {placementCfg.status}
            </Text>
          </View>

          {/* Reserves space for the persistent camera + ring (rendered absolutely) */}
          <View style={styles.placementRingSlot} pointerEvents="none" />

          <View style={styles.placementBottomArea}>
            {showStartAnyway && (
              <TouchableOpacity
                style={styles.startAnywayButton}
                onPress={startInhale}
                activeOpacity={0.85}
              >
                <Text style={styles.startAnywayText}>Start Anyway</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={cancelPlacement}
              activeOpacity={0.7}
              style={styles.placementCancelTouchable}
            >
              <Text style={styles.placementCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
        </SafeAreaView>
      ) : (
        <ExerciseScaffold
      titleSlot={
        <View style={styles.titleSlotWrap}>
          {pulse.active ? (
            <View style={styles.hrRow}>
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
            </View>
          ) : null}
        </View>
      }
      centerSlot={
        <Pressable
          onPress={handleCirclePress}
          disabled={phase !== 'hold' && phase !== 'inhale'}
          accessibilityRole="button"
          accessibilityLabel={
            phase === 'hold'
              ? 'Tap to release hold'
              : phase === 'inhale'
                ? 'Tap to skip inhale and begin hold'
                : undefined
          }
          style={({ pressed }) => [
            styles.circleTapTarget,
            (phase === 'hold' || phase === 'inhale') && pressed && styles.circleTapPressed,
          ]}
        >
          <BreathingCircle ref={circleRef}>
            {phase !== 'idle' ? <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text> : null}
            {phase === 'inhale' ? (
              <Text style={styles.countdown}>{inhaleCountdown}</Text>
            ) : displayTime ? (
              <Text style={styles.countdown}>{displayTime}</Text>
            ) : null}
            {phase === 'inhale' ? (
              <Text style={styles.tapHint}>Tap when ready</Text>
            ) : phase === 'hold' ? (
              <Text style={styles.tapHint}>Tap to release</Text>
            ) : null}
            {bestHoldSeconds > 0 ? (
              <View style={[styles.bestChip, isNewBest && styles.bestChipNew]}>
                <MaterialCommunityIcons
                  name={isNewBest ? 'trophy' : 'trophy-outline'}
                  size={12}
                  color={isNewBest ? colors.warning[700] : colors.text.tertiary}
                />
                <Text style={[styles.bestChipText, isNewBest && styles.bestChipTextNew]}>
                  {isNewBest ? 'New best · ' : 'Best · '}
                  {formatBest(bestHoldSeconds)}
                </Text>
              </View>
            ) : null}
          </BreathingCircle>
        </Pressable>
      }
      bottomSlot={
        <View style={styles.bottomContainer}>
          <View style={styles.guidanceWrap}>
            <Text style={styles.guidance}>{guidance}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.circleBtn, pressed && styles.circleBtnPressed]}
            onPress={handlePrimaryPress}
            accessibilityLabel={primaryLabel}
          >
            <MaterialCommunityIcons
              name={
                phase === 'idle' || phase === 'done'
                  ? 'play'
                  : phase === 'inhale'
                    ? 'chevron-double-down'
                    : 'hand-back-left-outline'
              }
              size={28}
              color={colors.neutral[900]}
            />
          </Pressable>
          <Pressable
            pointerEvents={phase === 'done' ? 'auto' : 'none'}
            style={({ pressed }) => [styles.viewResultsButton, pressed && styles.circleBtnPressed, phase !== 'done' && styles.viewResultsHidden]}
            onPress={handleViewResults}
          >
            <MaterialCommunityIcons name="chart-line" size={18} color={colors.primary.blue600} style={{ marginRight: spacing.xs }} />
            <Text style={styles.viewResultsText}>View Results</Text>
          </Pressable>
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
  placementSafeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  placementContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
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
  bottomContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  guidanceWrap: {
    minHeight: 66,
    justifyContent: 'center',
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
  circleBtnDisabled: {
    opacity: 0.4,
  },
  circleTapTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleTapPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  tapHint: {
    ...typography.caption.caption1,
    color: colors.neutral[50],
    opacity: 0.85,
    marginTop: spacing.xs,
  },
  viewResultsHidden: {
    opacity: 0,
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
  countdown: {
    ...typography.display.display1,
    color: colors.neutral[50],
  },
  bestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.elevated,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginTop: spacing.xs,
  },
  bestChipNew: {
    backgroundColor: colors.warning[100],
    borderColor: colors.warning[500],
  },
  bestChipText: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
  },
  bestChipTextNew: {
    color: colors.warning[700],
    fontWeight: '600',
  },
  guidance: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  viewResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.accentSoft,
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary.blue400,
  },
  viewResultsText: {
    ...typography.button.large,
    color: colors.primary.blue600,
  },
});
