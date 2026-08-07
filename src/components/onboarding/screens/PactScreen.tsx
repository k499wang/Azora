import { Text } from '../../common/Text';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { ContinuousHaptics } from '../../../native/continuousHaptics';
import Icon, { type IconName } from '../../common/icons/Icon';
import CelebrationOverlay from '../CelebrationOverlay';
import OnboardingScreenLayout from '../OnboardingScreenLayout';

const HOLD_DURATION_MS = 2000;
const STAMP_SIZE = 88;
const HAPTIC_RAMP_STEPS = 20;

interface PactScreenProps {
  dailyMinutes: number;
  stepIndex: number;
  stepCount: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

/* ─── StampButton ─── */
function StampButton({
  onSeal,
  disabled = false,
  loading = false,
}: {
  onSeal: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [isPressing, setIsPressing] = useState(false);
  const holdProgress = useRef(new Animated.Value(0)).current;
  const growScale = useRef(new Animated.Value(1)).current;
  const hasCompletedRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const progressRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /* track progress in a ref for the fallback haptic interval */
  useEffect(() => {
    const id = holdProgress.addListener(({ value }) => {
      progressRef.current = value;
    });
    return () => holdProgress.removeListener(id);
  }, [holdProgress]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopHaptics = useCallback(() => {
    ContinuousHaptics.stop();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startHapticRamping = useCallback(() => {
    if (!isHapticsEnabled()) return;

    if (ContinuousHaptics.isSupported) {
      const stepMs = HOLD_DURATION_MS / HAPTIC_RAMP_STEPS;
      for (let i = 0; i < HAPTIC_RAMP_STEPS; i++) {
        const intensity = 0.2 + (0.8 * (i / (HAPTIC_RAMP_STEPS - 1)));
        timeoutsRef.current.push(
          setTimeout(() => {
            ContinuousHaptics.start(stepMs + 60, intensity, 0.5);
          }, i * stepMs),
        );
      }
    } else {
      intervalRef.current = setInterval(() => {
        const p = progressRef.current;
        if (p >= 1) return;
        const style =
          p < 0.33
            ? Haptics.ImpactFeedbackStyle.Light
            : p < 0.66
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Heavy;
        Haptics.impactAsync(style).catch(() => {});
      }, 180);
    }
  }, []);

  const handlePressIn = useCallback(() => {
    if (disabled || loading || hasCompletedRef.current) return;

    hasCompletedRef.current = false;
    setIsPressing(true);

    growScale.stopAnimation();

    /* stamp grows bigger */
    Animated.timing(growScale, {
      toValue: 1.22,
      duration: HOLD_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    /* track progress */
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        setIsPressing(false);
        onSeal();
      }
    });

    startHapticRamping();
  }, [disabled, loading, growScale, holdProgress, onSeal, startHapticRamping]);

  const handlePressOut = useCallback(() => {
    if (hasCompletedRef.current) return;

    clearAllTimeouts();
    stopHaptics();
    holdProgress.stopAnimation();
    growScale.stopAnimation();

    /* stamp shrinks back */
    Animated.spring(growScale, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();

    /* progress resets */
    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    setIsPressing(false);
  }, [clearAllTimeouts, stopHaptics, holdProgress, growScale]);

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      stopHaptics();
    };
  }, [clearAllTimeouts, stopHaptics]);

  const isDisabled = disabled || loading;
  const isSealed = disabled && !loading;

  return (
    <View style={stampStyles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isSealed ? 'Commitment sealed' : 'Press and hold to seal your pact'}
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={stampStyles.pressable}
      >
        <Animated.View
          style={[
            stampStyles.stamp,
            isSealed && stampStyles.stampSealed,
            {
              transform: [
                { scale: growScale },
                { translateY: isPressing ? 2 : 0 },
              ],
            },
          ]}
        >
          <View style={stampStyles.stampInnerRing}>
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : isSealed ? (
              <Text style={stampStyles.stampCheck}>✓</Text>
            ) : (
              <Text style={stampStyles.stampText}>SEAL</Text>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const stampStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 116,
    height: 116,
  },
  pressable: {
    width: STAMP_SIZE,
    height: STAMP_SIZE,
    borderRadius: STAMP_SIZE / 2,
  },
  stamp: {
    width: STAMP_SIZE,
    height: STAMP_SIZE,
    borderRadius: STAMP_SIZE / 2,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  stampSealed: {
    backgroundColor: colors.success[700],
    shadowColor: colors.success[700],
  },
  stampInnerRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 13,
    letterSpacing: 3,
    color: colors.text.inverse,
  },
  stampCheck: {
    fontSize: 28,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.inverse,
  },
});

/* ─── PactScreen ─── */
export default function PactScreen({
  dailyMinutes,
  stepIndex,
  stepCount,
  isSubmitting,
  errorMessage,
  onConfirm,
  onBack,
}: PactScreenProps) {
  const [celebrating, setCelebrating] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const durationLabel =
    dailyMinutes === 0
      ? '30 seconds'
      : dailyMinutes === 1
        ? '1 minute'
        : `${dailyMinutes} minutes`;

  const clauses: Array<{ icon: IconName; text: string }> = [
    { icon: 'waves', text: `Breathe for ${durationLabel} a day.` },
    {
      icon: 'streak',
      text: "Show up even on the days I don't feel like it.",
    },
    { icon: 'check', text: 'Count every session as a win, however small.' },
    { icon: 'sun', text: 'Start again the day after I miss one.' },
  ];

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.selectionAsync().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (errorMessage) {
      setCelebrating(false);
      setHasConfirmed(false);
    }
  }, [errorMessage]);

  const handleConfirm = useCallback(() => {
    if (celebrating || isSubmitting) return;

    setHasConfirmed(true);
    setCelebrating(true);

    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }

    onConfirm();
  }, [celebrating, isSubmitting, onConfirm]);

  return (
    <>
      <OnboardingScreenLayout
        title="Make a promise to yourself to show up."
        subtitle="Consistency beats intensity. Every day matters more than any one session."
        progress={stepIndex / stepCount}
        onBack={onBack}
        footer={
          <View style={styles.footer}>
            <StampButton
              onSeal={handleConfirm}
              disabled={hasConfirmed || celebrating}
              loading={isSubmitting && !celebrating}
            />
            <Text style={styles.stampHint}>
              {hasConfirmed
                ? 'Your promise has been recorded.'
                : 'Hold the seal for 2 seconds'}
            </Text>
            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}
          </View>
        }
      >
        <View style={styles.list}>
          {clauses.map((clause) => (
            <View key={clause.text} style={styles.row}>
              <View style={styles.iconWrap}>
                <Icon name={clause.icon} size={16} color={colors.primary.blue600} />
              </View>
              <Text style={styles.clause}>{clause.text}</Text>
            </View>
          ))}
        </View>
      </OnboardingScreenLayout>

      {celebrating ? <CelebrationOverlay /> : null}
    </>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.xs,
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue100,
  },
  clause: {
    flex: 1,
    ...typography.body.medium,
    color: colors.text.primary,
  },

  footer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stampHint: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
});
