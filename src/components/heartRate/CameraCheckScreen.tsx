import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { FingerPlacementState } from '../../lib/heartRate/types';
import { HeartRateCameraPreview } from './HeartRateCameraPreview';
import type { HeartRateCameraPreviewProps } from './HeartRateCameraPreview';

interface CameraCheckScreenProps {
  fingerPlacement: FingerPlacementState;
  onStartAnyway: () => void;
  onCancel: () => void;
  timeoutSeconds?: number;
  cameraProps?: HeartRateCameraPreviewProps;
}

interface StateConfig {
  ringColor: string;
  status: string;
}

const stateConfigs: Record<FingerPlacementState, StateConfig> = {
  no_finger: {
    ringColor: colors.error[500],
    status: 'Cover the camera with your finger pad',
  },
  partial: {
    ringColor: colors.warning[500],
    status: 'Cover the camera fully',
  },
  too_much_pressure: {
    ringColor: '#8B5CF6',
    status: 'Ease up slightly',
  },
  good: {
    ringColor: colors.success[500],
    status: 'Hold phone and finger still',
  },
  lost: {
    ringColor: colors.error[500],
    status: 'Cover the camera with your finger pad',
  },
};

const RING_SIZE = 240;
const RING_STROKE = 10;

export function CameraCheckScreen({
  fingerPlacement,
  onStartAnyway,
  onCancel,
  timeoutSeconds = 10,
  cameraProps,
}: CameraCheckScreenProps) {
  const [showStartAnyway, setShowStartAnyway] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setShowStartAnyway(true), timeoutSeconds * 1000);
    return () => clearTimeout(t);
  }, [timeoutSeconds]);

  useEffect(() => {
    if (fingerPlacement !== 'good') {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startTimeRef.current = null;
      setHoldProgress(0);
      return;
    }

    startTimeRef.current = Date.now();
    const tick = () => {
      const start = startTimeRef.current;
      if (start == null) return;
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / 1500);
      setHoldProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [fingerPlacement]);

  const config = stateConfigs[fingerPlacement];

  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const r = RING_SIZE / 2 - RING_STROKE / 2;

  const track = Skia.Path.Make();
  track.addCircle(cx, cy, r);

  const arc = Skia.Path.Make();
  const rect = Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2);
  const arcSweep = fingerPlacement === 'good' ? 360 * holdProgress : 0;
  if (arcSweep > 0) {
    arc.addArc(rect, -90, arcSweep);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topSpacer} />

        <Text style={[styles.status, { color: config.ringColor }]}>
          {config.status}
        </Text>

        <View style={styles.ringWrap}>
          <View style={{ width: RING_SIZE, height: RING_SIZE }}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Path
                path={track}
                style="stroke"
                strokeWidth={RING_STROKE}
                color={config.ringColor + '33'}
              />
              {arcSweep > 0 && (
                <Path
                  path={arc}
                  style="stroke"
                  strokeWidth={RING_STROKE}
                  strokeCap="round"
                  color={config.ringColor}
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
          </View>
        </View>

        <View style={styles.bottomSpacer} />

        <View style={styles.actions}>
          {showStartAnyway && (
            <TouchableOpacity
              style={styles.startAnywayButton}
              onPress={onStartAnyway}
              activeOpacity={0.85}
            >
              <Text style={styles.startAnywayText}>Start Anyway</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.7}
            style={styles.cancelTouchable}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
  topSpacer: {
    flex: 1,
  },
  bottomSpacer: {
    flex: 1,
  },
  status: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
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
  actions: {
    width: '100%',
    gap: spacing.sm,
    alignItems: 'center',
  },
  startAnywayButton: {
    width: '100%',
    backgroundColor: colors.primary.blue600,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  startAnywayText: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.inverse,
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
