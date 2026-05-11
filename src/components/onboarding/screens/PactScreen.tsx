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
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { ContinuousHaptics } from '../../../native/continuousHaptics';
import CelebrationOverlay from '../CelebrationOverlay';

const HOLD_DURATION_MS = 2000;
const STAMP_SIZE = 100;
const HAPTIC_RAMP_STEPS = 20;

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
  const idlePulse = useRef(new Animated.Value(1)).current;
  const growScale = useRef(new Animated.Value(1)).current;
  const hasCompletedRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const progressRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const combinedScale = Animated.multiply(idlePulse, growScale);

  /* track progress in a ref for the fallback haptic interval */
  useEffect(() => {
    const id = holdProgress.addListener(({ value }) => {
      progressRef.current = value;
    });
    return () => holdProgress.removeListener(id);
  }, [holdProgress]);

  /* idle pulse when not pressing / not disabled */
  useEffect(() => {
    if (isPressing || disabled) {
      idlePulse.stopAnimation();
      idlePulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idlePulse, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(idlePulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isPressing, disabled, idlePulse]);

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
                { scale: combinedScale },
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
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.orange[700],
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  stampSealed: {
    backgroundColor: colors.success[500],
    shadowColor: colors.success[700],
  },
  stampInnerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: {
    fontFamily: fonts.bold,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1.5,
    color: colors.text.inverse,
  },
  stampCheck: {
    fontSize: 32,
    fontFamily: fonts.bold,
    fontWeight: '700',
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

  /* animated values */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const sealScale = useRef(new Animated.Value(0)).current;
  const cardBorder = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  /* entrance */
  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.selectionAsync().catch(() => {});
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (errorMessage) setCelebrating(false);
  }, [errorMessage]);

  /* confirmation animation */
  useEffect(() => {
    if (hasConfirmed) {
      /* seal pops onto card */
      Animated.timing(sealScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }).start();

      /* card border turns green */
      Animated.timing(cardBorder, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      /* card "thump" from the stamp impression */
      Animated.sequence([
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
      ]).start();
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

  const progress = stepIndex / stepCount;
  const clamped = Math.max(0, Math.min(1, progress));
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
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.backGlyph} onPress={onBack}>
            ←
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${clamped * 100}%` }]} />
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
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Title */}
            <View style={styles.copy}>
              <Text style={typography.title.title1}>Your daily pact</Text>
              <Text
                style={[
                  typography.body.small,
                  { color: colors.text.secondary },
                ]}
              >
                A promise to yourself, sealed with intention.
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

              <View style={styles.cardBody}>
                <Text
                  style={[
                    typography.body.medium,
                    { color: colors.text.secondary, lineHeight: 26 },
                  ]}
                >
                  Every day, I will breathe for{' '}
                  <Text style={styles.highlight}>{dailyMinutes} minutes</Text>{' '}
                  to focus on{' '}
                  <Text style={styles.highlight}>{focusText}</Text>.
                </Text>

                <Text
                  style={[
                    typography.body.medium,
                    { color: colors.text.secondary, lineHeight: 26 },
                  ]}
                >
                  I choose progress over perfection.
                </Text>

                {displayName ? (
                  <Text
                    style={[
                      typography.body.medium,
                      { color: colors.text.secondary, lineHeight: 26 },
                    ]}
                  >
                    — {displayName}
                  </Text>
                ) : null}

                <View style={styles.dateRow}>
                  <Text
                    style={[
                      typography.caption.caption2,
                      { color: colors.text.tertiary },
                    ]}
                  >
                    {today}
                  </Text>
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
      </SafeAreaView>

      {celebrating ? <CelebrationOverlay /> : null}
    </>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 24,
    padding: 4,
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
    ...card.base,
    width: '100%',
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardBody: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  highlight: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
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
    fontWeight: '700',
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
