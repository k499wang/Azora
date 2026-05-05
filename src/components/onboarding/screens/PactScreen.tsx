import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import CelebrationOverlay from '../CelebrationOverlay';

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

/* ─── floating-particle positions (static) ─── */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  key: i,
  x: 20 + Math.random() * 60,
  y: 10 + Math.random() * 80,
  size: 1.5 + Math.random() * 2.5,
  delay: Math.random() * 2000,
  duration: 2500 + Math.random() * 2500,
}));

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
  const glowPulse = useRef(new Animated.Value(0.6)).current;
  const sealScale = useRef(new Animated.Value(0)).current;
  const sealRotate = useRef(new Animated.Value(0)).current;
  const paperGlow = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

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

    /* ambient glow loop */
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.6,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim, glowPulse, slideAnim]);

  useEffect(() => {
    if (errorMessage) setCelebrating(false);
  }, [errorMessage]);

  /* seal stamp animation when confirmed */
  useEffect(() => {
    if (hasConfirmed) {
      Animated.sequence([
        Animated.timing(sealScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: true,
        }),
        Animated.timing(sealRotate, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(paperGlow, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      sealScale.setValue(0);
      sealRotate.setValue(0);
      paperGlow.setValue(0);
    }
  }, [hasConfirmed, paperGlow, sealRotate, sealScale]);

  const handleConfirm = () => {
    if (celebrating || isSubmitting) return;

    /* button press animation */
    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    setHasConfirmed(true);
    setCelebrating(true);

    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }

    onConfirm();
  };

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const progress = stepIndex / stepCount;
  const clamped = Math.max(0, Math.min(1, progress));

  /* interpolated values */
  const sealRotation = sealRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-12deg', '0deg'],
  });

  const paperGlowOpacity = paperGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
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
              <Text style={styles.title}>Your daily pact</Text>
              <Text style={styles.subtitle}>
                A promise to yourself, sealed with your mark.
              </Text>
            </View>

            {/* ── Magical Contract Paper ── */}
            <View style={styles.paperWrap}>
              {/* ambient glow behind paper */}
              <Animated.View
                style={[
                  styles.paperGlow,
                  { opacity: Animated.multiply(glowPulse, paperGlowOpacity) },
                ]}
                pointerEvents="none"
              />

              <View style={styles.paper}>
                {/* floating particles */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  {PARTICLES.map((p) => (
                    <FloatingParticle
                      key={p.key}
                      x={p.x}
                      y={p.y}
                      size={p.size}
                      delay={p.delay}
                      duration={p.duration}
                    />
                  ))}
                </View>

                {/* watermark */}
                <View style={styles.watermark} pointerEvents="none">
                  <Text style={styles.watermarkText}>AZORA</Text>
                </View>

                {/* paper header */}
                <View style={styles.paperHeader}>
                  <View style={styles.sealRing}>
                    <Text style={styles.sealRingText}>✦</Text>
                  </View>
                  <View style={styles.headerLine} />
                  <Text style={styles.docType}>DAILY COMMITMENT</Text>
                </View>

                {/* body */}
                <View style={styles.paperBody}>
                  <Text style={styles.salutation}>
                    I,{' '}
                    <Text style={styles.nameHighlight}>
                      {displayName || 'the undersigned'}
                    </Text>
                    , hereby commit to:
                  </Text>

                  <View style={styles.clauses}>
                    {[
                      `Practice breathing exercises for ${dailyMinutes} minutes every day.`,
                      `Focus on ${intentTitle.toLowerCase()}.`,
                      'Show up consistently — progress over perfection.',
                    ].map((text, i) => (
                      <View key={i} style={styles.clause}>
                        <View style={styles.clauseBullet}>
                          <Text style={styles.clauseBulletText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.clauseText}>
                          {i === 0 ? (
                            <>
                              Practice breathing exercises for{' '}
                              <Text style={styles.clauseStrong}>
                                {dailyMinutes} minutes
                              </Text>{' '}
                              every day.
                            </>
                          ) : i === 1 ? (
                            <>
                              Focus on{' '}
                              <Text style={styles.clauseStrong}>
                                {intentTitle.toLowerCase()}
                              </Text>
                              .
                            </>
                          ) : (
                            text
                          )}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.dateRow}>
                    <Text style={styles.dateText}>{today}</Text>
                  </View>
                </View>

                {/* wax-seal stamp (appears after confirming) */}
                {hasConfirmed && (
                  <Animated.View
                    style={[
                      styles.waxSeal,
                      {
                        transform: [
                          { scale: sealScale },
                          { rotate: sealRotation },
                        ],
                      },
                    ]}
                    pointerEvents="none"
                  >
                    <View style={styles.waxSealInner}>
                      <Text style={styles.waxSealText}>✦</Text>
                    </View>
                  </Animated.View>
                )}
              </View>
            </View>

            {/* ── Confirmation Section ── */}
            <View style={styles.confirmSection}>
              <View style={styles.confirmBadge}>
                <Text style={styles.confirmBadgeText}>
                  {hasConfirmed ? '✓  COMMITMENT SEALED' : 'READY TO COMMIT'}
                </Text>
              </View>

              <Animated.View
                style={[
                  styles.confirmButtonWrap,
                  { transform: [{ scale: btnScale }] },
                ]}
              >
                <OnboardingPrimaryButton
                  label={
                    hasConfirmed
                      ? 'Sealed — continuing...'
                      : 'I commit to this pact'
                  }
                  onPress={handleConfirm}
                  loading={isSubmitting && !celebrating}
                  disabled={hasConfirmed || celebrating}
                />
              </Animated.View>

              <Text style={styles.confirmHint}>
                {hasConfirmed
                  ? 'Your promise has been recorded.'
                  : 'Tap the button above to seal your commitment.'}
              </Text>
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

/* ─── Floating particle component ─── */
function FloatingParticle({
  x,
  y,
  size,
  delay,
  duration,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.15, 0.45, 0.15],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary.blue400,
        opacity,
        transform: [{ translateY }],
      }}
    />
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
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },

  /* ── Paper ── */
  paperWrap: {
    position: 'relative',
    alignSelf: 'center',
    width: '100%',
  },
  paperGlow: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 24,
    backgroundColor: colors.primary.blue400,
  },
  paper: {
    ...card.base,
    width: '100%',
    borderRadius: 18,
    backgroundColor: colors.background.elevated,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  watermark: {
    position: 'absolute',
    top: '28%',
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.03,
  },
  watermarkText: {
    fontFamily: fonts.bold,
    fontWeight: '700',
    fontSize: 80,
    letterSpacing: 12,
    color: colors.primary.blue700,
  },

  /* Paper header */
  paperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.neutral[50],
  },
  sealRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.orange[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealRingText: {
    fontSize: 14,
    color: colors.orange[500],
  },
  headerLine: {
    width: 1,
    height: 20,
    backgroundColor: colors.border.subtle,
  },
  docType: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.text.tertiary,
  },

  /* Paper body */
  paperBody: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  salutation: {
    ...typography.body.medium,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  nameHighlight: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },

  /* Clauses */
  clauses: { gap: spacing.md },
  clause: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  clauseBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  clauseBulletText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 11,
    color: colors.primary.blue700,
  },
  clauseText: {
    ...typography.body.medium,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 24,
  },
  clauseStrong: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dateText: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },

  /* Wax seal */
  waxSeal: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.orange[700],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  waxSealInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waxSealText: {
    fontSize: 18,
    color: colors.text.inverse,
  },

  /* ── Confirmation Section ── */
  confirmSection: {
    gap: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  confirmBadge: {
    backgroundColor: colors.primary.blue100,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  confirmBadgeText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.primary.blue700,
  },
  confirmButtonWrap: {
    width: '100%',
  },
  confirmHint: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
});
