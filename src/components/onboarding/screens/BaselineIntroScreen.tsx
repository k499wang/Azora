import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface BaselineIntroScreenProps {
  stepIndex: number;
  stepCount: number;
  name: string;
  onContinue: () => void;
  onBack: () => void;
}

export default function BaselineIntroScreen({
  stepIndex,
  stepCount,
  name,
  onContinue,
  onBack,
}: BaselineIntroScreenProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }

    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroSlide, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    const rippleLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    const r1 = rippleLoop(ring1, 0);
    const r2 = rippleLoop(ring2, 1100);
    r1.start();
    r2.start();

    return () => {
      pulseLoop.stop();
      r1.stop();
      r2.stop();
    };
  }, [pulse, ring1, ring2, heroFade, heroSlide]);

  const trimmed = name.trim();
  const lead = trimmed
    ? `Let's read your heart, ${trimmed}.`
    : "Let's read your heart.";

  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="I'm ready" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <View style={styles.visualWrap}>
          <Animated.View
            style={[
              styles.ripple,
              {
                opacity: ring1.interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [0.5, 0.15, 0],
                }),
                transform: [
                  {
                    scale: ring1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.9],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ripple,
              {
                opacity: ring2.interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [0.4, 0.12, 0],
                }),
                transform: [
                  {
                    scale: ring2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.9],
                    }),
                  },
                ],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.heart,
              {
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Icon name="heart-glow" size={86} color={colors.error[500]} />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.copy,
            {
              opacity: heroFade,
              transform: [{ translateY: heroSlide }],
            },
          ]}
        >
          <Text style={styles.kicker}>NEXT UP</Text>
          <Text style={styles.headline}>{lead}</Text>
          <Text style={styles.sub}>
            Sixty seconds with the back camera — and your plan tunes itself to
            you.
          </Text>
        </Animated.View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing['2xl'],
  },
  visualWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.error[500],
  },
  heart: {
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: colors.error[100],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.error[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  kicker: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 2.4,
    color: colors.text.tertiary,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: colors.text.primary,
    textAlign: 'center',
  },
  sub: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
