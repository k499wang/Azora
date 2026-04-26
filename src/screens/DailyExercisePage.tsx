import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import BreathingCircle, {
  BreathingCircleRef,
} from '../components/exercise/BreathingCircle';
import ExerciseScaffold from '../components/exercise/ExerciseScaffold';
import { useLivePulse } from '../hooks/useLivePulse';
import { LiveHeartRateMonitor } from '../components/meditation/LiveHeartRateMonitor';
import { usePostHog } from 'posthog-react-native';
import { AnalyticsEvent } from '../services/analytics/events';
import { captureException } from '../services/analytics/errorTracking';
import type { DailyExerciseScreenProps } from '../app/navigation';

type HoldPhase = 'idle' | 'inhale' | 'hold' | 'done';

const PHASE_LABELS: Record<HoldPhase, string> = {
  idle: 'Daily Hold',
  inhale: 'Inhale',
  hold: 'Hold',
  done: 'Released',
};

interface BpmSample {
  t: number;
  bpm: number;
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
  const [hrEnabled, setHrEnabled] = useState(false);
  const [lastSamples, setLastSamples] = useState<BpmSample[]>([]);
  const [isNewBest, setIsNewBest] = useState(false);

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

  const handleToggleHr = useCallback(async () => {
    try {
      if (hrEnabled) {
        setHrEnabled(false);
        return;
      }
      const granted = hasPermission ? true : await requestPermission();
      if (granted) setHrEnabled(true);
    } catch (error) {
      captureException(error, {
        flow: 'daily_breath_hold',
        action: 'toggle_heart_rate',
        screen_name: 'DailyExercise',
      });
    }
  }, [hrEnabled, hasPermission, requestPermission]);

  const beginHold = useCallback(() => {
    clearTimer();
    samplesRef.current = [];
    holdStartAtRef.current = Date.now();
    setHoldSeconds(0);
    setPhase('hold');
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

  const startInhale = () => {
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
  };

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
      startInhale();
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
      : phase === 'inhale'
        ? 'Fill your lungs gently. Tap the circle when your inhale feels complete.'
        : phase === 'hold'
          ? 'Tap the circle when you need to breathe.'
          : 'Nice work. Rest for a moment, then begin again when you feel ready.';

  const displayTime = phase === 'hold' || phase === 'done' ? formatTime(holdSeconds) : null;

  return (
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
              />
            ) : null}
          </View>
          <View style={styles.patternRow}>
            {[
              { key: 'inhale', icon: 'arrow-up' as const, label: '6s' },
              { key: 'hold', icon: 'dots-horizontal' as const, label: '∞' },
            ].map((p, i, arr) => (
              <View key={p.key} style={styles.patternItem}>
                <View style={styles.patternCircle}>
                  <MaterialCommunityIcons name={p.icon} size={24} color={colors.text.secondary} />
                </View>
                <Text style={styles.patternSecs}>{p.label}</Text>
                {i < arr.length - 1 && <View style={styles.patternConnector} />}
              </View>
            ))}
          </View>
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
  );
}

const styles = StyleSheet.create({
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
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  viewResultsHidden: {
    opacity: 0,
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
