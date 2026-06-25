import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { ContinuousHaptics } from '../../../native/continuousHaptics';
import CelebrationOverlay from '../CelebrationOverlay';
import AmbientBackground from '../../common/AmbientBackground';

const HOLD_DURATION_MS = 2000;
const STAMP_SIZE = 100;
const HAPTIC_RAMP_STEPS = 20;
const ENTRANCE_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const ENTRANCE_INITIAL_SCALE = 0.992;

interface PactScreenProps {
  intentTitle: string;
  displayName: string | null;
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
      toValue: 1.28,
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
    width: 160,
    height: 160,
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
    backgroundColor: colors.orange[700],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3A1F00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 10,
  },
  stampSealed: {
    backgroundColor: colors.success[700],
    shadowColor: '#0A2A12',
  },
  stampInnerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 30,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.inverse,
  },
});

/* ─── PactScreen ─── */
export default function PactScreen({
  intentTitle,
  displayName,
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
  const progress = stepIndex / stepCount;
  const clampedProgress = Math.max(0, Math.min(1, progress));

  /* animated values */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(ENTRANCE_INITIAL_SCALE)).current;
  const progressFill = useRef(new Animated.Value(clampedProgress)).current;
  const entranceAnimationRef = useRef<{ stop: () => void } | null>(null);
  const entranceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedEntranceRef = useRef(false);
  const sealScale = useRef(new Animated.Value(0)).current;
  const cardBorder = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.selectionAsync().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const animation = Animated.timing(progressFill, {
      toValue: clampedProgress,
      duration: 520,
      easing: ENTRANCE_EASING,
      useNativeDriver: false,
    });

    animation.start();
    return () => animation.stop();
  }, [clampedProgress, progressFill]);

  const startEntranceAnimation = useCallback(() => {
    if (hasStartedEntranceRef.current) return;
    hasStartedEntranceRef.current = true;

    entranceTimeoutRef.current = setTimeout(() => {
      const entranceAnimation = Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 680,
          easing: ENTRANCE_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 760,
          easing: ENTRANCE_EASING,
          useNativeDriver: true,
        }),
      ]);

      entranceAnimationRef.current = entranceAnimation;
      entranceAnimation.start(({ finished }) => {
        if (finished) entranceAnimationRef.current = null;
      });
    }, 80);
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    return () => {
      if (entranceTimeoutRef.current) {
        clearTimeout(entranceTimeoutRef.current);
        entranceTimeoutRef.current = null;
      }
      entranceAnimationRef.current?.stop();
      entranceAnimationRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (errorMessage) {
      setCelebrating(false);
      setHasConfirmed(false);
    }
  }, [errorMessage]);

  /* confirmation animation */
  useEffect(() => {
    if (hasConfirmed) {
      /* seal pops onto card */
      const sealAnimation = Animated.timing(sealScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      });

      /* card border turns green */
      const borderAnimation = Animated.timing(cardBorder, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });

      /* card "thump" from the stamp impression */
      const cardAnimation = Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 0.985,
          duration: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 4,
          tension: 300,
          useNativeDriver: true,
        }),
      ]);

      sealAnimation.start();
      borderAnimation.start();
      cardAnimation.start();

      return () => {
        sealAnimation.stop();
        borderAnimation.stop();
        cardAnimation.stop();
      };
    } else {
      sealScale.setValue(0);
      cardBorder.setValue(0);
      cardScale.setValue(1);
    }
  }, [hasConfirmed, cardBorder, cardScale, sealScale]);

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

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const progressWidth = progressFill.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const focusText =
    intentTitle.trim().toLowerCase() === 'sleep better'
      ? 'sleeping better'
      : intentTitle.trim().toLowerCase();

  const borderColor = cardBorder.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border.subtle, colors.success[500]],
  });

  return (
    <>
      <View style={styles.root}>
        <AmbientBackground />
        <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <Animated.View
          onLayout={startEntranceAnimation}
          style={[styles.entrance, { opacity: fadeAnim }]}
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.backGlyph} onPress={onBack}>
            ←
          </Text>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            {/* Title */}
            <View style={styles.copy}>
              <Text style={typography.title.title1}>Make a promise to yourself to show up every day</Text>
              <Text
                style={[
                  typography.body.small,
                  { color: colors.text.secondary },
                ]}
              >
                Consistency beats intensity. Every day matters more than any one session.
              </Text>
            </View>

            {/* ── Personal Pledge Card ── */}
            <Animated.View
              style={[
                styles.card,
                {
                  borderColor,
                  transform: [{ scale: cardScale }],
                },
              ]}
            >
              {/* checkmark seal (appears after confirming) */}
              {hasConfirmed && (
                <Animated.View
                  style={[styles.seal, { transform: [{ scale: sealScale }] }]}
                  pointerEvents="none"
                >
                  <Text style={styles.sealCheck}>✓</Text>
                </Animated.View>
              )}

              <View style={styles.cardHeader}>
                <View style={styles.headerRule} />
                <Text style={styles.wordmark}>MY COMMITMENT</Text>
                <View style={styles.headerRule} />
              </View>

              <View style={styles.cardBody}>
                <Text
                  style={[
                    typography.body.medium,
                    { color: colors.text.secondary, lineHeight: 28 },
                  ]}
                >
                  Just{' '}
                  <Text style={styles.highlight}>{dailyMinutes} minutes</Text>{' '}
                  a day. That's the whole plan.
                </Text>

                <Text
                  style={[
                    typography.body.medium,
                    { color: colors.text.secondary, lineHeight: 28 },
                  ]}
                >
                  Showing up is enough. Small steps add up.
                </Text>

                <View style={styles.signatureBlock}>
                  <View style={styles.signatureRule} />
                  <View style={styles.signatureRow}>
                    <Text
                      style={[
                        typography.caption.caption2,
                        { color: colors.text.tertiary, letterSpacing: 1 },
                      ]}
                    >
                      {displayName ? displayName.toUpperCase() : 'SIGNED'}
                    </Text>
                    <Text
                      style={[
                        typography.caption.caption2,
                        { color: colors.text.tertiary, letterSpacing: 1 },
                      ]}
                    >
                      {today.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* ── Stamp Section ── */}
            <View style={styles.stampSection}>
              <StampButton
                onSeal={handleConfirm}
                disabled={hasConfirmed || celebrating}
                loading={isSubmitting && !celebrating}
              />

              <View style={styles.hintWrap}>
                {!hasConfirmed && (
                  <Text style={styles.stampHintIcon}>↑</Text>
                )}
                <Text style={[typography.body.small, styles.stampHint]}>
                  {hasConfirmed
                    ? 'Your promise has been recorded.'
                    : 'Hold the seal for 2 seconds'}
                </Text>
              </View>
            </View>

            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}
          </Animated.View>
        </ScrollView>
        </Animated.View>
        </SafeAreaView>
      </View>

      {celebrating ? <CelebrationOverlay /> : null}
    </>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  entrance: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  backGlyph: {
    fontSize: 22,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    lineHeight: 24,
    padding: spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.primary.blue100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
  },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },

  /* Title */
  copy: { gap: spacing.sm },

  /* ── Pledge Card ── */
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: colors.surface.welcome,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#1A1206',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  headerRule: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(204,106,0,0.22)',
  },
  wordmark: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 10,
    letterSpacing: 4,
    color: colors.orange[700],
  },
  cardBody: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  highlight: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  signatureBlock: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  signatureRule: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /* Seal */
  seal: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.success[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1,
  },
  sealCheck: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '600',
    color: colors.text.inverse,
  },

  /* ── Stamp Section ── */
  stampSection: {
    gap: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  hintWrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stampHint: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  stampHintIcon: {
    fontSize: 18,
    color: colors.text.tertiary,
    lineHeight: 22,
  },

  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
});
