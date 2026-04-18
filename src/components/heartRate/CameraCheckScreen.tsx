import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
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
  bgColor: string;
  accentColor: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle: string;
}

const stateConfigs: Record<FingerPlacementState, StateConfig> = {
  no_finger: {
    bgColor: '#FFF5F5',
    accentColor: colors.error[500],
    icon: 'gesture-tap',
    title: 'Place your fingertip over the camera and flash',
    subtitle: 'Cover both the lens and flash completely',
  },
  partial: {
    bgColor: '#FFFBEB',
    accentColor: colors.warning[500],
    icon: 'alert-circle-outline',
    title: 'Adjust your finger — cover the lens fully',
    subtitle: 'Make sure the flash is also covered',
  },
  too_much_pressure: {
    bgColor: '#F5F3FF',
    accentColor: '#8B5CF6',
    icon: 'hand-back-right',
    title: 'Ease up slightly',
    subtitle: 'Lighten your touch a little',
  },
  good: {
    bgColor: '#F0FDF4',
    accentColor: colors.success[500],
    icon: 'check-circle-outline',
    title: 'Good — hold still',
    subtitle: 'Keep your finger in place...',
  },
  lost: {
    bgColor: '#FFF5F5',
    accentColor: colors.error[500],
    icon: 'gesture-tap',
    title: 'Place your fingertip over the camera and flash',
    subtitle: 'Cover both the lens and flash completely',
  },
};

export function CameraCheckScreen({
  fingerPlacement,
  onStartAnyway,
  onCancel,
  timeoutSeconds = 10,
  cameraProps,
}: CameraCheckScreenProps) {
  const [showStartAnyway, setShowStartAnyway] = useState(false);

  const goodProgressAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show "Start Anyway" after timeout
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setShowStartAnyway(true);
    }, timeoutSeconds * 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [timeoutSeconds]);

  // Animate good progress bar
  useEffect(() => {
    if (fingerPlacement === 'good') {
      // Animate progress bar over 1.5s
      goodProgressAnim.setValue(0);
      Animated.timing(goodProgressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    } else {
      goodProgressAnim.stopAnimation();
      goodProgressAnim.setValue(0);
    }
  }, [fingerPlacement, goodProgressAnim]);

  const config = stateConfigs[fingerPlacement];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: config.bgColor }]}>
      <View style={styles.container}>
        {/* Status area */}
        <View style={styles.statusArea}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: `${config.accentColor}20` }]}>
            <MaterialCommunityIcons
              name={config.icon}
              size={52}
              color={config.accentColor}
            />
          </View>

          {/* Text */}
          <Text style={[styles.title, { color: config.accentColor }]}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>

          {/* Good progress bar */}
          {fingerPlacement === 'good' && (
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: goodProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: config.accentColor,
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* Camera preview */}
        <View style={styles.previewContainer}>
          <View style={[styles.previewRing, { borderColor: config.accentColor }]}>
            <View style={styles.previewClip}>
              {cameraProps != null ? (
                <HeartRateCameraPreview {...cameraProps} />
              ) : (
                <View style={[styles.previewPlaceholder, { backgroundColor: config.accentColor + '20' }]} />
              )}
            </View>
          </View>
          <Text style={styles.diagramLabel}>Cover this camera with your fingertip</Text>
        </View>

        <View style={styles.spacer} />

        {/* Actions */}
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
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  statusArea: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading.heading1,
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  progressBarContainer: {
    width: '80%',
    height: 6,
    backgroundColor: colors.border.subtle,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  previewContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  previewRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    padding: 4,
    marginBottom: spacing.sm,
  },
  previewClip: {
    flex: 1,
    borderRadius: 72,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewPlaceholder: {
    flex: 1,
  },
  diagramLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 200,
  },
  spacer: {
    flex: 1,
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  startAnywayText: {
    ...typography.button.large,
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
