import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import BreathingCircle, {
  type BreathingCircleRef,
} from '../../exercise/BreathingCircle';
import { PersistentCameraRing } from '../../heartRate/PersistentCameraRing';
import { LiveHeartRateMonitor } from '../../meditation/LiveHeartRateMonitor';
import { useHeartRateStream } from '../../../hooks/useHeartRateStream';
import { useBreathPhaseAudio } from '../../../hooks/useBreathPhaseAudio';
import {
  startInhaleVibration,
  stopInhaleVibration,
} from '../../../native/inhaleVibration';
import type { FingerPlacementState } from '../../../lib/heartRate/types';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

export interface BaselineResult {
  completed: boolean;
  avgBpm: number | null;
  earlyBpm: number | null;
  lateBpm: number | null;
  bpmDrop: number | null;
  durationSec: number;
  bpmHistory: number[];
}

interface BaselineScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: (result: BaselineResult) => void;
  onBack: () => void;
}

type Phase = 'intro' | 'placement' | 'running' | 'done';

const SESSION_MS = 60_000;
const HALF_BREATH_SEC = 5.5;
const PLACEMENT_GOOD_DURATION_MS = 1500;
const PLACEMENT_RING_SIZE = 240;

interface PreviewFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

const STEPS: { num: string; label: string }[] = [
  { num: '1', label: 'Rest your fingertip on the back camera lens.' },
  { num: '2', label: 'Breathe along with the circle for 60 seconds.' },
  { num: '3', label: "We'll show how your heart responds." },
];

function placementConfig(p: FingerPlacementState): { ringColor: string; status: string } {
  switch (p) {
    case 'good':
      return { ringColor: colors.success[500], status: 'Hold still…' };
    case 'partial':
      return { ringColor: colors.warning[500], status: 'Cover the lens fully' };
    case 'too_much_pressure':
      return { ringColor: colors.warning[500], status: 'Ease up slightly' };
    case 'no_finger':
    case 'lost':
    default:
      return {
        ringColor: colors.error[500],
        status: 'Place your fingertip over the back camera',
      };
  }
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

export default function BaselineScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: BaselineScreenProps) {
  const insets = useSafeAreaInsets();
  const stream = useHeartRateStream();
  const [phase, setPhase] = useState<Phase>('intro');
  const [breathLabel, setBreathLabel] = useState<'Inhale' | 'Exhale'>('Inhale');
  const [progress, setProgress] = useState(0);
  const [placementHoldProgress, setPlacementHoldProgress] = useState(0);
  const [previewFrame, setPreviewFrame] = useState<PreviewFrame | null>(null);

  const circleRef = useRef<BreathingCircleRef>(null);
  const startedAtRef = useRef<number | null>(null);
  const earlyBpmsRef = useRef<number[]>([]);
  const lateBpmsRef = useRef<number[]>([]);
  const allBpmsRef = useRef<number[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hudOpacity = useRef(new Animated.Value(1)).current;
  const [hudVisible, setHudVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placementCfg = placementConfig(stream.fingerPlacement);

  const showHud = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setHudVisible(true);
    Animated.timing(hudOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(hudOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setHudVisible(false);
      });
    }, 3000);
  }, [hudOpacity]);

  useBreathPhaseAudio(
    phase === 'running' ? (breathLabel === 'Inhale' ? 'inhale' : 'exhale') : null,
  );

  const cameraProps = useMemo(() => {
    if (stream.device == null) return undefined;
    return {
      device: stream.device,
      format: stream.format,
      frameProcessor: stream.frameProcessor,
      torchMode: stream.torchMode,
      isActive: phase === 'placement' || phase === 'running',
    };
  }, [
    stream.device,
    stream.format,
    stream.frameProcessor,
    stream.torchMode,
    phase,
  ]);

  const pillPreviewStyle =
    phase === 'running' && previewFrame != null
      ? [
          styles.persistentCameraPillPreview,
          {
            top: previewFrame.y - (PLACEMENT_RING_SIZE - previewFrame.height) / 2,
            left: previewFrame.x - (PLACEMENT_RING_SIZE - previewFrame.width) / 2,
          },
        ]
      : null;

  const finishCapture = (completed: boolean) => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    stopInhaleVibration();
    circleRef.current?.reset();
    stream.stopStream();
    setPhase('done');

    const earlyBpm = average(earlyBpmsRef.current);
    const lateBpm = average(lateBpmsRef.current);
    const avgBpm = average(allBpmsRef.current);
    const bpmDrop =
      earlyBpm != null && lateBpm != null ? earlyBpm - lateBpm : null;
    const durationSec = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : 0;

    if (completed && isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
    }

    onContinue({
      completed,
      avgBpm,
      earlyBpm,
      lateBpm,
      bpmDrop,
      durationSec,
      bpmHistory: allBpmsRef.current.slice(),
    });
  };

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      stopInhaleVibration();
      stream.stopStream();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'running' || stream.currentBpm == null) return;
    const elapsed = startedAtRef.current
      ? Date.now() - startedAtRef.current
      : 0;
    allBpmsRef.current.push(stream.currentBpm);
    if (elapsed < SESSION_MS / 2) {
      earlyBpmsRef.current.push(stream.currentBpm);
    } else {
      lateBpmsRef.current.push(stream.currentBpm);
    }
  }, [stream.currentBpm, phase]);

  useEffect(() => {
    if (phase !== 'placement' || stream.fingerPlacement !== 'good') {
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
  }, [phase, stream.fingerPlacement]);

  useEffect(() => {
    if (phase !== 'placement') return;
    if (stream.fingerPlacement !== 'good') return;
    const t = setTimeout(() => {
      startedAtRef.current = Date.now();
      earlyBpmsRef.current = [];
      lateBpmsRef.current = [];
      allBpmsRef.current = [];
      setProgress(0);
      setBreathLabel('Inhale');
      setPhase('running');
    }, PLACEMENT_GOOD_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase, stream.fingerPlacement]);

  useEffect(() => {
    if (phase === 'running') {
      showHud();
    } else {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setHudVisible(true);
      hudOpacity.setValue(1);
    }
  }, [phase, showHud, hudOpacity]);

  useEffect(() => {
    if (phase !== 'running') return;

    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    let inhale = false;
    const startBreath = () => {
      circleRef.current?.expand(HALF_BREATH_SEC);
      setBreathLabel('Inhale');
      startInhaleVibration(HALF_BREATH_SEC * 1000);
    };
    const raf = requestAnimationFrame(startBreath);

    breathTimerRef.current = setInterval(() => {
      if (inhale) {
        circleRef.current?.expand(HALF_BREATH_SEC);
        setBreathLabel('Inhale');
        startInhaleVibration(HALF_BREATH_SEC * 1000);
      } else {
        circleRef.current?.contract(HALF_BREATH_SEC);
        setBreathLabel('Exhale');
        stopInhaleVibration();
      }
      inhale = !inhale;
    }, HALF_BREATH_SEC * 1000);

    tickRef.current = setInterval(() => {
      const started = startedAtRef.current ?? Date.now();
      const elapsed = Date.now() - started;
      const ratio = Math.min(1, elapsed / SESSION_MS);
      setProgress(ratio);
      if (ratio >= 1) finishCapture(true);
    }, 100);

    return () => {
      cancelAnimationFrame(raf);
      stopInhaleVibration();
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase]);

  const handleStart = async () => {
    const granted = stream.hasPermission
      ? true
      : await stream.requestPermission();
    if (!granted) {
      finishCapture(false);
      return;
    }
    setPhase('placement');
    stream.startStream();
    setTimeout(() => stream.startStreaming(), 200);
  };

  const remainingSec = Math.max(0, Math.ceil((1 - progress) * 60));

  if (phase === 'placement' || phase === 'running') {
    return (
      <View style={styles.fill}>
        {phase === 'running' && !hudVisible ? (
          <Pressable
            style={styles.tapToRevealLayer}
            onPress={showHud}
            accessibilityLabel="Show controls"
          />
        ) : null}

        {phase === 'placement' ? (
          <SafeAreaView style={styles.placementSafeArea}>
          <View style={styles.placementContainer}>
            <View style={styles.placementTopArea}>
              <Text
                style={[
                  styles.placementStatus,
                  { color: placementCfg.ringColor },
                ]}
              >
                {placementCfg.status}
              </Text>
            </View>

            <View style={styles.placementRingSlot} pointerEvents="none" />

            <View style={styles.placementBottomArea}>
              <Pressable
                accessibilityRole="button"
                onPress={() => finishCapture(false)}
                style={({ pressed }) => [
                  styles.cancel,
                  pressed && styles.skipPressed,
                ]}
              >
                <Text style={styles.skipText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
          </SafeAreaView>
        ) : (
          <View style={[styles.runningStage, { paddingTop: insets.top }]}>
            <View style={styles.runningHeader}>
              <View style={styles.runningPillRow}>
                <LiveHeartRateMonitor
                  active
                  fingerPlacement={stream.fingerPlacement}
                  currentBpm={stream.currentBpm}
                  beatTick={stream.beatTick}
                  device={stream.device}
                  format={stream.format}
                  frameProcessor={stream.frameProcessor}
                  torchMode={stream.torchMode}
                  mountCamera={false}
                  showCameraPreview
                  onPreviewFrame={setPreviewFrame}
                />
              </View>
            </View>

            <View style={styles.runningCenter}>
              <BreathingCircle ref={circleRef}>
                <Text style={styles.phaseLabel}>{breathLabel}</Text>
              </BreathingCircle>
            </View>

            <Animated.View
              style={[styles.runningBottom, { opacity: hudOpacity }]}
            >
              <View style={styles.timePill}>
                <Text style={styles.timeValue}>{remainingSec}s</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress * 100}%` },
                  ]}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => finishCapture(false)}
                style={({ pressed }) => [
                  styles.cancel,
                  pressed && styles.skipPressed,
                ]}
              >
                <Text style={styles.skipText}>End early</Text>
              </Pressable>
            </Animated.View>
          </View>
        )}

        <View
          pointerEvents="none"
          style={[
            styles.persistentCamera,
            phase === 'placement'
              ? styles.persistentCameraVisible
              : pillPreviewStyle ?? styles.persistentCameraHidden,
          ]}
        >
          <PersistentCameraRing
            ringColor={
              phase === 'placement'
                ? placementCfg.ringColor
                : colors.primary.blue600
            }
            trackColor={
              phase === 'placement'
                ? placementCfg.ringColor + '33'
                : colors.border.subtle
            }
            progress={phase === 'placement' ? placementHoldProgress : 0}
            cameraProps={cameraProps}
            smoothProgress={phase === 'placement'}
          />
        </View>
      </View>
    );
  }

  return (
    <OnboardingScreenLayout
      title="Read your baseline"
      subtitle="A 60-second breathing check so we can tune your plan."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <View style={styles.introFooter}>
          <OnboardingPrimaryButton label="Start" onPress={handleStart} />
          <Pressable
            accessibilityRole="button"
            onPress={() => finishCapture(false)}
            style={({ pressed }) => [
              styles.skip,
              pressed && styles.skipPressed,
            ]}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.intro}>
        {STEPS.map((step, index) => (
          <View
            key={step.num}
            style={[
              styles.stepRow,
              index !== 0 && styles.stepRowDivider,
            ]}
          >
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{step.num}</Text>
            </View>
            <Text style={styles.stepLabel}>{step.label}</Text>
          </View>
        ))}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginTop: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  stepRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue100,
  },
  stepBadgeText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 14,
    color: colors.primary.blue700,
  },
  stepLabel: {
    ...typography.body.medium,
    color: colors.text.primary,
    flex: 1,
  },

  fill: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tapToRevealLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  runningStage: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  runningHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  runningCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runningPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  runningBottom: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  timePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  timeValue: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
  },
  phaseLabel: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 22,
    letterSpacing: 0,
    color: colors.text.inverse,
  },
  progressBar: {
    height: 3,
    width: '70%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
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

  introFooter: {
    gap: spacing.sm,
  },
  skip: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipPressed: {
    opacity: 0.6,
  },
  skipText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});
