import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../theme/colors';
import { typography, fonts } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { card } from '../../../theme/card';
import type { SetupScreenProps } from '../../../lib/heartRate/types';
import {
  DEFAULT_CAPTURE_MODE,
  type HeartRateCaptureMode,
} from '../../../lib/heartRate/captureModes';
import { CaptureModeToggle } from '../CaptureModeToggle';
import type { RootStackNavigationProp } from '../../../app/navigation';
import { useFeatureAccess } from '../../../hooks/useFeatureAccess';
import { FeatureKey } from '../../../services/subscriptions/featureAccess';
import { PaywallPlacement } from '../../../services/paywall';

const STEPS = [
  'Cover the rear camera with the fleshy pad of your finger, not your nail',
  'Keep your phone and finger still',
  'Use gentle pressure and breathe normally',
];

// Soft glow rings layered with palette alpha — the same hex+alpha pattern used
// elsewhere for ring tints (e.g. the result hero and capture ring).
const GLOW_OUTER = colors.error[500] + '14';
const GLOW_MID = colors.error[500] + '24';

export function DefaultInstructionScreen({ onNext }: SetupScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp<'HeartRate'>>();
  const { isPro } = useFeatureAccess(FeatureKey.AdvancedStats);
  const [mode, setMode] = useState<HeartRateCaptureMode>(DEFAULT_CAPTURE_MODE);

  const heroIn = useRef(new Animated.Value(0)).current;
  const bodyIn = useRef(new Animated.Value(0)).current;
  const footerIn = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(heroIn, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(bodyIn, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(footerIn, { toValue: 1, duration: 520, useNativeDriver: true }),
    ]).start();

    const heartbeat = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1700, useNativeDriver: true }),
      ]),
    );
    heartbeat.start();
    return () => heartbeat.stop();
  }, [heroIn, bodyIn, footerIn, pulse]);

  const openPaywallForLockedMode = () => {
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.HeartRateProGate,
      sourceScreen: 'HeartRate',
      sourceAction: 'capture_mode_full',
      feature: FeatureKey.AdvancedStats,
    });
  };

  const rise = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
    ],
  });

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.12] });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <Animated.View style={[styles.hero, rise(heroIn)]}>
        <Text style={styles.eyebrow}>Private · On-device</Text>

        <View style={styles.halo}>
          <Animated.View
            style={[
              styles.ring,
              styles.ringOuter,
              { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
            ]}
          />
          <View style={[styles.ring, styles.ringMid]} />
          <View style={styles.core}>
            <MaterialCommunityIcons name="heart-pulse" size={34} color={colors.error[500]} />
          </View>
        </View>

        <Text style={styles.title}>Measure Heart Rate</Text>
        <Text style={styles.subtitle}>
          Your camera reads your pulse from the light passing through your fingertip.
        </Text>
      </Animated.View>

      <Animated.View style={rise(bodyIn)}>
        <View style={[card.base, card.shadow, styles.stepsCard]}>
          {STEPS.map((text, i) => (
            <View key={i} style={[styles.stepRow, i > 0 && styles.stepDivider]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{text}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View style={[styles.footer, rise(footerIn)]}>
        <CaptureModeToggle
          value={mode}
          onChange={setMode}
          isPro={isPro}
          onLockedPress={openPaywallForLockedMode}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => onNext({ mode })}
          onPressIn={() =>
            Animated.spring(pressScale, {
              toValue: 0.97,
              useNativeDriver: true,
              speed: 40,
              bounciness: 0,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(pressScale, {
              toValue: 1,
              useNativeDriver: true,
              speed: 40,
              bounciness: 6,
            }).start()
          }
        >
          <Animated.View style={[styles.ctaShadow, { transform: [{ scale: pressScale }] }]}>
            <LinearGradient
              colors={[colors.primary.blue500, colors.primary.blue700]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cta}
            >
              <MaterialCommunityIcons name="heart-pulse" size={18} color={colors.text.inverse} />
              <Text style={styles.ctaText}>Begin measurement</Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: 'center',
  },
  eyebrow: {
    ...typography.overline,
    color: colors.text.tertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  halo: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
  },
  ringOuter: {
    width: 168,
    height: 168,
    backgroundColor: GLOW_OUTER,
  },
  ringMid: {
    width: 116,
    height: 116,
    backgroundColor: GLOW_MID,
  },
  core: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.error[100],
    shadowColor: colors.error[700],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  stepsCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  stepDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.primary.blue700,
  },
  stepText: {
    ...typography.body.small,
    color: colors.text.primary,
    flex: 1,
  },
  spacer: {
    flex: 1,
    minHeight: spacing.xl,
  },
  footer: {
    gap: spacing.md,
  },
  ctaShadow: {
    borderRadius: 16,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 6,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaText: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
