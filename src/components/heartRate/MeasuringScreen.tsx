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
import type { FingerPlacementState } from '../../lib/heartRate/types';

interface MeasuringScreenProps {
  progress: number; // 0-1
  secondsRemaining: number;
  fingerPlacement: FingerPlacementState;
  onCancel: () => void;
}

function getSignalQuality(placement: FingerPlacementState): {
  label: string;
  color: string;
} {
  switch (placement) {
    case 'good':
      return { label: 'Good', color: colors.success[500] };
    case 'partial':
      return { label: 'Fair', color: colors.warning[500] };
    case 'lost':
      return { label: 'Lost', color: colors.error[500] };
    default:
      return { label: 'Weak', color: colors.warning[500] };
  }
}

export function MeasuringScreen({
  progress,
  secondsRemaining,
  fingerPlacement,
  onCancel,
}: MeasuringScreenProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;
  const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    pulseAnimation.current = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    pulseAnimation.current.start();

    return () => {
      pulseAnimation.current?.stop();
    };
  }, [pulseAnim, pulseOpacity]);

  const signalQuality = getSignalQuality(fingerPlacement);
  const isFingerLost = fingerPlacement === 'lost' || fingerPlacement === 'no_finger';

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

        {/* Title */}
        <Text style={styles.title}>Measuring...</Text>

        {/* Pulse ring + countdown */}
        <View style={styles.pulseContainer}>
          {/* Outer pulse ring */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
              },
            ]}
          />
          {/* Inner circle */}
          <View style={styles.countdownCircle}>
            <MaterialCommunityIcons
              name="heart"
              size={24}
              color={colors.primary.blue600}
              style={styles.heartIcon}
            />
            <Text style={styles.countdown}>{secondsRemaining}</Text>
            <Text style={styles.countdownLabel}>seconds</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{Math.round(progress * 100)}% complete</Text>

        {/* Signal quality */}
        <View style={styles.signalRow}>
          <Text style={styles.signalLabel}>Signal: </Text>
          <View style={[styles.signalDot, { backgroundColor: signalQuality.color }]} />
          <Text style={[styles.signalValue, { color: signalQuality.color }]}>
            {signalQuality.label}
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
  },
  warningText: {
    ...typography.body.small,
    color: '#92400E',
    flex: 1,
  },
  title: {
    ...typography.title.title2,
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  pulseContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary.blue100,
  },
  countdownCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  heartIcon: {
    marginBottom: 2,
  },
  countdown: {
    ...typography.title.title1,
    color: colors.primary.blue600,
    fontSize: 40,
    lineHeight: 44,
  },
  countdownLabel: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border.subtle,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary.blue600,
    borderRadius: 4,
  },
  progressLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    marginBottom: spacing.lg,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  signalLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  signalValue: {
    ...typography.body.small,
    fontWeight: '600',
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
