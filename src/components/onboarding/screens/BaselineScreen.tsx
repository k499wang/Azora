import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Icon from '../../common/icons/Icon';
import { PersistentCameraRing } from '../../heartRate/PersistentCameraRing';
import { useHeartRateStream } from '../../../hooks/useHeartRateStream';
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

const SESSION_MS = 20_000;

const CAMERA_PPG_ILLUSTRATION = require('../../../../assets/onboarding/camerappg.png');

const SCIENCE_BODY_TEXT =
  'When you cover the back camera with your fingertip, the flash lights your skin from the inside. Each heartbeat pushes a small wave of blood through the capillaries, changing how much light reflects back into the lens. We sample those brightness shifts about 30 times a second — the same optical method clinical pulse oximeters use — and turn them into your BPM.';
const SESSION_SEC = SESSION_MS / 1000;
const PLACEMENT_GOOD_DURATION_MS = 1500;

type ReadingTip = {
  id: string;
  title: string;
  detail: string;
};

const READING_TIPS: ReadingTip[] = [
  {
    id: 'calm',
    title: 'I’m can stay still',
    detail: 'Sitting still in a quiet spot.',
  },
  {
    id: 'cover',
    title: 'Lens is covered completely',
    detail: 'One fingertip sealing both completely.',
  },
  {
    id: 'pressure',
    title: 'Gentle, steady pressure',
    detail: 'Firm enough to seal — light enough to feel my pulse.',
  },
  {
    id: 'hold',
    title: 'Ready to hold for 20 seconds',
    detail: 'Won’t move or talk until it’s done.',
  },
];

function placementConfig(p: FingerPlacementState): { ringColor: string; status: string } {
  switch (p) {
    case 'good':
      return { ringColor: colors.primary.blue500, status: 'Hold still…' };
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
  const [progress, setProgress] = useState(0);
  const [checkedTips, setCheckedTips] = useState<Set<string>>(() => new Set());
  const [scienceOpen, setScienceOpen] = useState(false);
  const [scienceContentHeight, setScienceContentHeight] = useState(0);
  const scienceAnim = useRef(new Animated.Value(0)).current;
  const allChecked = checkedTips.size === READING_TIPS.length;

  useEffect(() => {
    Animated.timing(scienceAnim, {
      toValue: scienceOpen ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [scienceOpen, scienceAnim]);

  const scienceHeight = scienceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, scienceContentHeight],
  });
  const toggleTip = (id: string) => {
    setCheckedTips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
  };

  const startedAtRef = useRef<number | null>(null);
  const earlyBpmsRef = useRef<number[]>([]);
  const lateBpmsRef = useRef<number[]>([]);
  const allBpmsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  const hudOpacity = useRef(new Animated.Value(1)).current;
  const [hudVisible, setHudVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bpmOpacity = useRef(new Animated.Value(0.6)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const placementCfg = placementConfig(stream.fingerPlacement);
  const hasConfirmedSignal =
    stream.streamState === 'streaming' &&
    (stream.fingerPlacement === 'good' || stream.fingerPlacement === 'partial');
  const hasUsableFingerSignal =
    stream.fingerPlacement === 'good' || stream.fingerPlacement === 'partial';
  const visibleBeatTick = hasUsableFingerSignal ? stream.beatTick : 0;
  const bpmDisplay =
    phase === 'running' && stream.currentBpm != null && stream.currentBpm > 0
      ? Math.round(stream.currentBpm)
      : null;
  const signalGood = stream.fingerPlacement === 'good';
  const showSignalWarning = phase === 'running' && !signalGood;

  useEffect(() => {
    if (visibleBeatTick <= 0) return;
    if (phase === 'running' && isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    bpmOpacity.setValue(0.95);
    Animated.timing(bpmOpacity, {
      toValue: 0.6,
      duration: 420,
      useNativeDriver: true,
    }).start();
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.28,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visibleBeatTick, phase, bpmOpacity, heartScale]);

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

  const cameraProps = useMemo(() => {
    if (stream.device == null) return null;
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

  const finishCapture = (completed: boolean) => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
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
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      stream.stopStream();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'running' || !hasConfirmedSignal || stream.currentBpm == null) return;
    const elapsed = startedAtRef.current
      ? Date.now() - startedAtRef.current
      : 0;
    allBpmsRef.current.push(stream.currentBpm);
    if (elapsed < SESSION_MS / 2) {
      earlyBpmsRef.current.push(stream.currentBpm);
    } else {
      lateBpmsRef.current.push(stream.currentBpm);
    }
  }, [stream.currentBpm, phase, hasConfirmedSignal]);

  useEffect(() => {
    if (phase !== 'placement') return;
    if (stream.fingerPlacement !== 'good') return;
    const t = setTimeout(() => {
      startedAtRef.current = Date.now();
      earlyBpmsRef.current = [];
      lateBpmsRef.current = [];
      allBpmsRef.current = [];
      setProgress(0);
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

    const tick = () => {
      const started = startedAtRef.current ?? Date.now();
      const ratio = Math.min(1, (Date.now() - started) / SESSION_MS);
      setProgress(ratio);
      if (ratio >= 1) {
        rafRef.current = null;
        finishCapture(true);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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
  };

  const remainingSec = Math.max(0, Math.ceil((1 - progress) * SESSION_SEC));

  if (phase === 'placement' || phase === 'running') {
    const isRunning = phase === 'running';
    return (
      <View style={styles.fill}>
        {isRunning && !hudVisible ? (
          <Pressable
            style={styles.tapToRevealLayer}
            onPress={showHud}
            accessibilityLabel="Show controls"
          />
        ) : null}

        <View style={[styles.stage, { paddingTop: insets.top }]}>
          <View style={styles.header} />

          <View style={styles.center}>
            <View style={styles.centerStack}>
              <PersistentCameraRing
                ringColor={placementCfg.ringColor}
                trackColor={isRunning ? undefined : placementCfg.ringColor + '33'}
                progress={isRunning ? progress : 0}
                cameraProps={cameraProps ?? undefined}
                fingerPlacement={stream.fingerPlacement}
                beatTick={visibleBeatTick}
                showHeartIcon={isRunning}
              />
              <View style={styles.belowSlot}>
                {!isRunning ? (
                  <Text
                    style={[
                      styles.hintText,
                      { color: placementCfg.ringColor },
                    ]}
                  >
                    {placementCfg.status}
                  </Text>
                ) : (
                  <View style={styles.metricStack}>
                    {bpmDisplay != null ? (
                      <View
                        style={[
                          styles.bpmRow,
                          showSignalWarning && styles.bpmRowDim,
                        ]}
                      >
                        <Animated.Text
                          style={[
                            styles.bpmNumber,
                            showSignalWarning ? null : { opacity: bpmOpacity },
                          ]}
                        >
                          {bpmDisplay}
                        </Animated.Text>
                        <Text
                          style={[
                            styles.bpmUnit,
                            showSignalWarning && styles.bpmUnitDim,
                          ]}
                        >
                          bpm
                        </Text>
                        <Animated.View
                          style={
                            showSignalWarning
                              ? null
                              : { transform: [{ scale: heartScale }] }
                          }
                        >
                          <MaterialCommunityIcons
                            name="heart"
                            size={18}
                            color={
                              showSignalWarning
                                ? colors.text.tertiary
                                : colors.error[500]
                            }
                          />
                        </Animated.View>
                      </View>
                    ) : null}
                    {showSignalWarning ? (
                      <View style={styles.warningRow}>
                        <MaterialCommunityIcons
                          name="alert-circle-outline"
                          size={12}
                          color={colors.warning[500]}
                        />
                        <Text style={styles.warningText}>
                          {placementCfg.status}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          </View>

          <Animated.View
            style={[
              styles.bottom,
              isRunning ? { opacity: hudOpacity } : null,
            ]}
          >
            <View
              style={[
                styles.timePill,
                !isRunning && styles.hiddenPlaceholder,
              ]}
            >
              <Text style={styles.timeValue}>{remainingSec}s</Text>
            </View>
            <View
              style={[
                styles.progressBar,
                !isRunning && styles.hiddenPlaceholder,
              ]}
            >
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
              <Text style={styles.skipText}>
                {isRunning ? 'End early' : 'Cancel'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <View style={styles.introFooter}>
          <OnboardingPrimaryButton
            label={allChecked ? 'I’m ready — start' : 'Check each step to start'}
            onPress={handleStart}
            disabled={!allChecked}
          />
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
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>Read this first</Text>
        <Text style={styles.headingSubtitle}>
          A clean {SESSION_SEC}-second reading is what calibrates your plan.
          Set yourself up with these four cues.
        </Text>
      </View>

      <View style={styles.illustrationWrap}>
        <Image
          source={CAMERA_PPG_ILLUSTRATION}
          style={styles.illustration}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
          accessibilityLabel="Fingertip covering the back camera and flash"
        />
      </View>

      <View style={styles.scienceWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: scienceOpen }}
          onPress={() => {
            setScienceOpen((v) => !v);
            if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
          }}
          style={({ pressed }) => [
            styles.scienceButton,
            pressed && styles.scienceButtonPressed,
          ]}
        >
          <View style={styles.scienceButtonIcon}>
            <Icon name="microscope" size={16} color={colors.primary.blue700} />
          </View>
          <Text style={styles.scienceButtonLabel}>How it works</Text>
          <Text style={styles.scienceButtonChevron}>
            {scienceOpen ? '−' : '+'}
          </Text>
        </Pressable>
        <View
          style={styles.scienceMeasure}
          pointerEvents="none"
          aria-hidden
        >
          <Text
            style={styles.scienceBody}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (h > 0 && Math.abs(h - scienceContentHeight) > 0.5) {
                setScienceContentHeight(h);
              }
            }}
          >
            {SCIENCE_BODY_TEXT}
          </Text>
        </View>
        <Animated.View
          style={[
            styles.scienceBodyClip,
            { height: scienceHeight, opacity: scienceAnim },
          ]}
          pointerEvents={scienceOpen ? 'auto' : 'none'}
        >
          <Text style={styles.scienceBody}>{SCIENCE_BODY_TEXT}</Text>
        </Animated.View>
      </View>

      <View style={styles.checklistSection}>
        <Text style={styles.checklistTitle}>Before you start</Text>
        <Text style={styles.checklistSubtitle}>
          Tap each one as you’re set up.
        </Text>
        <View style={styles.tipsList}>
        {READING_TIPS.map((tip, i) => {
          const checked = checkedTips.has(tip.id);
          return (
            <Pressable
              key={tip.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={tip.title}
              onPress={() => toggleTip(tip.id)}
              style={({ pressed }) => [
                styles.tipRow,
                pressed && styles.tipRowPressed,
              ]}
            >
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked ? (
                  <Icon name="check" size={14} color={colors.text.inverse} />
                ) : null}
              </View>
              <View style={styles.tipText}>
                <Text
                  style={[styles.tipTitle, checked && styles.tipTitleChecked]}
                >
                  {tip.title}
                </Text>
                <Text style={styles.tipDetail}>{tip.detail}</Text>
              </View>
              {i < READING_TIPS.length - 1 && <View style={styles.tipDivider} />}
            </Pressable>
          );
        })}
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  headingTitle: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: colors.text.primary,
  },
  headingSubtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -spacing.lg,
  },
  illustration: {
    width: '100%',
    height: 200,
  },
  scienceWrap: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  scienceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 999,
    backgroundColor: colors.background.accentSoft,
    borderWidth: 1,
    borderColor: colors.primary.blue100,
  },
  scienceButtonPressed: {
    opacity: 0.7,
  },
  scienceButtonIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scienceButtonLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.primary.blue700,
    letterSpacing: -0.1,
  },
  scienceButtonChevron: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: colors.primary.blue700,
    marginLeft: 2,
  },
  scienceBodyClip: {
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  scienceMeasure: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
  },
  scienceBody: {
    ...typography.body.small,
    color: colors.text.secondary,
    lineHeight: 20,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  checklistSection: {
    gap: spacing.xs,
  },
  checklistTitle: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 22,
    color: colors.text.primary,
  },
  checklistSubtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  tipsList: {
    marginTop: spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  tipRowPressed: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary.blue600,
    borderColor: colors.primary.blue600,
  },
  tipText: {
    flex: 1,
    gap: 2,
  },
  tipTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.1,
  },
  tipTitleChecked: {
    color: colors.text.secondary,
  },
  tipDetail: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  tipDivider: {
    position: 'absolute',
    bottom: 0,
    left: 24 + spacing.md,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },

  fill: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tapToRevealLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  stage: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  belowSlot: {
    minHeight: 64,
    marginTop: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  metricStack: {
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  bpmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bpmRowDim: {
    opacity: 0.25,
  },
  bpmNumber: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 0,
    color: colors.text.primary,
  },
  bpmUnit: {
    ...typography.caption.caption1,
    marginLeft: -4,
    marginTop: 10,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  bpmUnitDim: {
    color: colors.text.tertiary,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningText: {
    ...typography.caption.caption1,
    fontFamily: fonts.medium,
    color: colors.warning[700],
  },
  bottom: {
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
  hiddenPlaceholder: {
    opacity: 0,
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
