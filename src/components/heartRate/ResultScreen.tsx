import React, { useEffect, useRef } from 'react';
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
import type { CaptureResult } from '../../lib/heartRate/types';

interface ResultScreenProps {
  result: CaptureResult;
  onRetry: () => void;
  onDone: () => void;
  context?: string;
}

function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence > 0.7) return { label: 'High Confidence', color: colors.success[500] };
  if (confidence > 0.4) return { label: 'Moderate Confidence', color: colors.warning[500] };
  return { label: 'Low Confidence', color: colors.error[500] };
}

function getErrorMessage(
  error: CaptureResult['error'],
): { title: string; message: string } {
  switch (error) {
    case 'low_confidence':
      return {
        title: 'Signal Was Noisy',
        message: 'Signal was too noisy for an accurate reading. Try again in a quiet position.',
      };
    case 'signal_lost':
      return {
        title: 'Finger Moved',
        message: 'Your finger moved during measurement. Try to keep it still for the full 15 seconds.',
      };
    case 'too_few_samples':
      return {
        title: 'Not Enough Data',
        message: 'Not enough data was collected. Make sure your finger covers the camera and flash.',
      };
    case 'camera_error':
      return {
        title: 'Camera Error',
        message: 'A camera error occurred. Please try again.',
      };
    default:
      return {
        title: 'Reading Unclear',
        message: 'We were unable to get a clear reading. Please try again.',
      };
  }
}

export function ResultScreen({ result, onRetry, onDone, context }: ResultScreenProps) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;

  const isSuccess = result.reading != null;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    if (isSuccess) {
      // Heart pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(heartPulse, {
            toValue: 1.2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(heartPulse, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(600),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isSuccess, scaleAnim, opacityAnim, heartPulse]);

  if (isSuccess && result.reading) {
    const reading = result.reading;
    const confidence = getConfidenceLabel(reading.confidence);

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.content,
              { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
            ]}
          >
            {/* Heart icon */}
            <Animated.View style={{ transform: [{ scale: heartPulse }] }}>
              <View style={styles.heartIconContainer}>
                <MaterialCommunityIcons
                  name="heart"
                  size={56}
                  color={colors.error[500]}
                />
              </View>
            </Animated.View>

            <Text style={styles.resultTitle}>Heart Rate</Text>

            {/* BPM display */}
            <View style={styles.bpmContainer}>
              <Text style={styles.bpmNumber}>{reading.bpm}</Text>
              <Text style={styles.bpmUnit}>bpm</Text>
            </View>

            {/* Confidence badge */}
            <View style={[styles.confidenceBadge, { backgroundColor: `${confidence.color}15` }]}>
              <View style={[styles.confidenceDot, { backgroundColor: confidence.color }]} />
              <Text style={[styles.confidenceText, { color: confidence.color }]}>
                {confidence.label}
              </Text>
            </View>

            {/* Details */}
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>
                  {Math.round(reading.durationMs / 1000)}s
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Samples</Text>
                <Text style={styles.detailValue}>{reading.sampleCount}</Text>
              </View>
              {context != null && (
                <>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Context</Text>
                    <Text style={styles.detailValue}>{context}</Text>
                  </View>
                </>
              )}
            </View>
          </Animated.View>

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.primaryButton} onPress={onDone} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  const errorInfo = getErrorMessage(result.error);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Error icon */}
          <View style={styles.errorIconContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={56}
              color={colors.warning[500]}
            />
          </View>

          <Text style={styles.resultTitle}>Reading Unclear</Text>
          <Text style={styles.errorTitle}>{errorInfo.title}</Text>
          <Text style={styles.errorMessage}>{errorInfo.message}</Text>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsHeading}>Tips for a better reading:</Text>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="circle-small" size={16} color={colors.text.tertiary} />
              <Text style={styles.tipText}>Cover both the lens and flash fully</Text>
            </View>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="circle-small" size={16} color={colors.text.tertiary} />
              <Text style={styles.tipText}>Apply steady, gentle pressure</Text>
            </View>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="circle-small" size={16} color={colors.text.tertiary} />
              <Text style={styles.tipText}>Stay still for the full 15 seconds</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.spacer} />

        <View style={styles.errorActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onRetry}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDone}
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  heartIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  resultTitle: {
    ...typography.title.title2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  bpmContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  bpmNumber: {
    fontSize: 80,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 88,
  },
  bpmUnit: {
    ...typography.heading.heading1,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    ...typography.caption.caption1,
    fontWeight: '600',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  detailLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  detailValue: {
    ...typography.body.small,
    color: colors.text.primary,
    fontWeight: '600',
  },
  errorTitle: {
    ...typography.heading.heading1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  tipsCard: {
    width: '100%',
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsHeading: {
    ...typography.body.small,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    ...typography.body.small,
    color: colors.text.secondary,
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary.blue600,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.button.large,
    color: colors.text.inverse,
  },
  errorActions: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
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
