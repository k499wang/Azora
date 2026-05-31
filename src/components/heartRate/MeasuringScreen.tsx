import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { FingerPlacementState } from '../../lib/heartRate/types';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { AnimatedCalibratingText } from './AnimatedCalibratingText';
import { HeartRateCameraPreview } from './HeartRateCameraPreview';
import type { HeartRateCameraPreviewProps } from './HeartRateCameraPreview';

interface MeasuringScreenProps {
  progress: number; // 0-1
  secondsRemaining: number;
  currentBpm: number | null;
  beatTick: number;
  fingerPlacement: FingerPlacementState;
  onCancel: () => void;
  cameraProps?: HeartRateCameraPreviewProps;
}

const RING_SIZE = 240;
const RING_STROKE = 10;

export function MeasuringScreen({
  progress,
  currentBpm,
  beatTick,
  fingerPlacement,
  onCancel,
  cameraProps,
}: MeasuringScreenProps) {
  const beatScale = useRef(new Animated.Value(1)).current;
  const beatOpacity = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const [smoothProgress, setSmoothProgress] = useState(progress);
  const targetProgressRef = useRef(progress);
  const currentProgressRef = useRef(progress);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    targetProgressRef.current = progress;

    if (rafRef.current != null) return;

    const tick = () => {
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      const diff = target - current;
      if (Math.abs(diff) < 0.0005) {
        currentProgressRef.current = target;
        setSmoothProgress(target);
        rafRef.current = null;
        return;
      }
      const next = current + diff * 0.12;
      currentProgressRef.current = next;
      setSmoothProgress(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [progress]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (beatTick <= 0) return;

    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    beatScale.setValue(0.92);
    beatOpacity.setValue(0.45);
    heartScale.setValue(1);

    Animated.parallel([
      Animated.timing(beatScale, {
        toValue: 1.18,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(beatOpacity, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.22,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [beatOpacity, beatScale, beatTick, heartScale]);

  const isFingerLost = fingerPlacement === 'lost' || fingerPlacement === 'no_finger';

  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const r = RING_SIZE / 2 - RING_STROKE / 2;
  const clamped = Math.max(0, Math.min(1, smoothProgress));

  const track = Skia.Path.Make();
  track.addCircle(cx, cy, r);

  const arc = Skia.Path.Make();
  const rect = Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2);
  arc.addArc(rect, -90, 360 * clamped);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Finger lost banner */}
        {isFingerLost && (
          <View style={styles.warningBanner}>
            <MaterialCommunityIcons
              name="alert-outline"
              size={16}
              color={colors.warning[500]}
            />
            <Text style={styles.warningText}>
              Finger moved — reposition and hold still
            </Text>
          </View>
        )}

        <View style={styles.topSpacer} />

        {/* Ring with camera preview inside */}
        <View style={styles.pulseContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: beatScale }],
                opacity: beatOpacity,
              },
            ]}
          />
          <View style={{ width: RING_SIZE, height: RING_SIZE }}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Path
                path={track}
                style="stroke"
                strokeWidth={RING_STROKE}
                color={colors.border.subtle}
              />
              {clamped > 0 && (
                <Path
                  path={arc}
                  style="stroke"
                  strokeWidth={RING_STROKE}
                  strokeCap="round"
                  color={colors.primary.blue600}
                />
              )}
            </Canvas>
            <View style={styles.previewClip}>
              {cameraProps != null ? (
                <HeartRateCameraPreview {...cameraProps} />
              ) : (
                <View style={styles.previewPlaceholder} />
              )}
            </View>
            <View style={styles.heartOverlay} pointerEvents="none">
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <MaterialCommunityIcons
                  name="heart"
                  size={36}
                  color={colors.text.inverse}
                />
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Current BPM */}
        <View style={styles.currentBpmRow}>
          <Text style={styles.currentBpmLabel}>Current BPM</Text>
          {currentBpm == null ? (
            <AnimatedCalibratingText textStyle={styles.currentBpmCalibrating} />
          ) : (
            <View style={styles.currentBpmValueRow}>
              <Text style={styles.currentBpmValue}>{currentBpm}</Text>
              <Text style={styles.currentBpmUnit}>bpm</Text>
            </View>
          )}
        </View>

        <View style={styles.spacer} />

        {/* Tip */}
        <View style={styles.tipContainer}>
          <MaterialCommunityIcons
            name="information-outline"
            size={14}
            color={colors.text.tertiary}
          />
          <Text style={styles.tipText}>Keep your finger pressed firmly over the lens</Text>
        </View>

        {/* Cancel */}
        <TouchableOpacity
          onPress={onCancel}
          activeOpacity={0.7}
          style={styles.cancelTouchable}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  warningBanner: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  warningText: {
    ...typography.body.small,
    color: '#92400E',
    flex: 1,
  },
  topSpacer: {
    flex: 1,
  },
  pulseContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  pulseRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.primary.blue100,
  },
  previewClip: {
    position: 'absolute',
    top: RING_STROKE + 4,
    left: RING_STROKE + 4,
    right: RING_STROKE + 4,
    bottom: RING_STROKE + 4,
    borderRadius: (RING_SIZE - (RING_STROKE + 4) * 2) / 2,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewPlaceholder: {
    flex: 1,
    backgroundColor: '#000',
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBpmRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: 80,
  },
  currentBpmLabel: {
    ...typography.body.medium,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  currentBpmValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    minWidth: 120,
  },
  currentBpmValue: {
    ...typography.title.title1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 56,
    lineHeight: 60,
    minWidth: 64,
    textAlign: 'right',
  },
  currentBpmCalibrating: {
    ...typography.title.title3,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    textAlign: 'center',
  },
  currentBpmUnit: {
    ...typography.body.medium,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 20,
    marginLeft: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  tipText: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    flex: 1,
    textAlign: 'center',
  },
  cancelTouchable: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
