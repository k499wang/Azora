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

export default function DailyExercisePage({
  navigation,
}: DailyExerciseScreenProps) {
  const posthog = usePostHog();
  const circleRef = useRef<BreathingCircleRef>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const samplesRef = useRef<BpmSample[]>([]);
  const [phase, setPhase] = useState<HoldPhase>('idle');
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [bestHoldSeconds, setBestHoldSeconds] = useState(0);
  const [hrEnabled, setHrEnabled] = useState(false);
  const [lastSamples, setLastSamples] = useState<BpmSample[]>([]);

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

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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

  const startInhale = () => {
    clearTimer();
    samplesRef.current = [];
    setLastSamples([]);
    setHoldSeconds(0);
    setPhase('inhale');
    circleRef.current?.reset();
    circleRef.current?.expand(6);
    if (hrEnabled) startPulse();
    posthog.capture(AnalyticsEvent.DailyBreathHoldStarted);
  };

  const beginHold = () => {
    clearTimer();
    samplesRef.current = [];
    setHoldSeconds(0);
    setPhase('hold');
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
  };

  const releaseHold = () => {
    clearTimer();
    const samples = samplesRef.current.slice();
    setLastSamples(samples);
    setBestHoldSeconds((current) => Math.max(current, holdSeconds));
    setPhase('done');
    stopPulse();
    posthog.capture(AnalyticsEvent.DailyBreathHoldReleased, {
      hold_seconds: holdSeconds,
      best_hold_seconds: Math.max(bestHoldSeconds, holdSeconds),
      hr_monitoring_enabled: hrEnabled,
      bpm_sample_count: samples.length,
    });
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
        <BreathingCircle ref={circleRef}>
          {phase !== 'idle' ? <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text> : null}
          {displayTime ? <Text style={styles.countdown}>{displayTime}</Text> : null}
        </BreathingCircle>
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
                phase === 'idle' || phase === 'done' ? 'play' :
                phase === 'inhale' ? 'chevron-right' : 'hand-back-left-outline'
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
