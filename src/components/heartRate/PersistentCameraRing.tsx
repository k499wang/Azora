import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { HeartRateCameraPreview } from './HeartRateCameraPreview';
import type { HeartRateCameraPreviewProps } from './HeartRateCameraPreview';
import type { FingerPlacementState } from '../../lib/heartRate/types';

export interface PersistentCameraRingProps {
  ringColor: string;
  trackColor?: string;
  progress: number;
  cameraProps?: Omit<HeartRateCameraPreviewProps, 'fingerPlacement'>;
  fingerPlacement?: FingerPlacementState;
  beatTick?: number;
  showHeartIcon?: boolean;
  hapticOnBeat?: boolean;
  smoothProgress?: boolean;
}

export const RING_SIZE = 240;
export const RING_STROKE = 10;

export const PersistentCameraRing = memo(function PersistentCameraRing({
  ringColor,
  trackColor,
  progress,
  cameraProps,
  fingerPlacement,
  beatTick = 0,
  showHeartIcon = false,
  hapticOnBeat = false,
  smoothProgress = false,
}: PersistentCameraRingProps) {
  const beatScale = useRef(new Animated.Value(1)).current;
  const beatOpacity = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const [renderedProgress, setRenderedProgress] = useState(progress);
  const targetRef = useRef(progress);
  const currentRef = useRef(progress);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!smoothProgress) {
      setRenderedProgress(progress);
      return;
    }
    targetRef.current = progress;
    if (rafRef.current != null) return;

    const tick = () => {
      const target = targetRef.current;
      const current = currentRef.current;
      const diff = target - current;
      if (Math.abs(diff) < 0.0005) {
        currentRef.current = target;
        setRenderedProgress(target);
        rafRef.current = null;
        return;
      }
      const next = current + diff * 0.12;
      currentRef.current = next;
      setRenderedProgress(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [progress, smoothProgress]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (beatTick <= 0) return;

    if (hapticOnBeat && isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    beatScale.setValue(0.92);
    beatOpacity.setValue(0.45);
    heartScale.setValue(1);

    Animated.parallel([
      Animated.timing(beatScale, { toValue: 1.18, duration: 360, useNativeDriver: true }),
      Animated.timing(beatOpacity, { toValue: 0, duration: 360, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.22, duration: 90, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]),
    ]).start();
  }, [beatOpacity, beatScale, beatTick, hapticOnBeat, heartScale]);

  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const r = RING_SIZE / 2 - RING_STROKE / 2;
  const clamped = Math.max(0, Math.min(1, renderedProgress));

  const track = useMemo(() => {
    const path = Skia.Path.Make();
    path.addCircle(cx, cy, r);
    return path;
  }, [cx, cy, r]);

  const arc = useMemo(() => {
    if (clamped <= 0) return null;
    const path = Skia.Path.Make();
    const rect = Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2);
    path.addArc(rect, -90, 360 * clamped);
    return path;
  }, [cx, cy, r, clamped]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseRing,
          { transform: [{ scale: beatScale }], opacity: beatOpacity },
        ]}
      />
      <View style={{ width: RING_SIZE, height: RING_SIZE }}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Path
            path={track}
            style="stroke"
            strokeWidth={RING_STROKE}
            color={trackColor ?? ringColor + '33'}
          />
          {arc != null && (
            <Path
              path={arc}
              style="stroke"
              strokeWidth={RING_STROKE}
              strokeCap="round"
              color={ringColor}
            />
          )}
        </Canvas>
        <View style={styles.previewClip}>
          {cameraProps != null ? (
            <HeartRateCameraPreview {...cameraProps} fingerPlacement={fingerPlacement} />
          ) : (
            <View style={styles.previewPlaceholder} />
          )}
        </View>
        {showHeartIcon && (
          <View style={styles.heartOverlay} pointerEvents="none">
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <MaterialCommunityIcons
                name="heart"
                size={36}
                color={colors.text.inverse}
              />
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
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
});
