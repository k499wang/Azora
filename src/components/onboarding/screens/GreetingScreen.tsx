import { AnimatedText } from '../../common/Text';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface GreetingScreenProps {
  name: string;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const WAVE_SIZE = 256;
const HAND_PATH =
  'M45.7 111.2c-9-4-13.7-14.8-20.3-27.5l-9.1-17.4c-2.3-4.4-.9-9.7 3.3-11.9 4.1-2.1 9.1-.5 11.4 3.9l6.6 12.5c-3.8-8.2-13.4-27.9-16.8-35.3-2-4.3-.4-9.3 3.7-11.2 4.2-2 9.1-.1 11.2 4.2l12.1 25.4-11-31.4c-1.8-4.8.4-9.8 5-11.5 4.7-1.7 9.6.9 11.4 5.6l10.4 28.1-5.7-27.4c-1.2-5 1.8-9.7 6.6-10.9 4.9-1.2 9.4 2 10.7 7l10.9 44.8 4.1-11.2c1.8-5 6.6-7.6 11.5-6 4.8 1.7 7.2 6.9 5.4 11.9L99 80.7c-5.9 16.4-11.6 26.6-23.8 31.3-9.8 3.7-20.5 3.2-29.5-.8Z';

function WaveHandIllustration() {
  return (
    <Svg
      width={WAVE_SIZE}
      height={WAVE_SIZE}
      viewBox="0 0 128 128"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path
        d={HAND_PATH}
        fill="#F6C06A"
      />
      <Path
        d={HAND_PATH}
        fill="none"
        stroke="#9D5A2E"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function GreetingScreen({
  name,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  onSkip,
}: GreetingScreenProps) {
  const displayName = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return 'there';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }, [name]);

  const wave = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const textEnter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(enter, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textEnter, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    });

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wave, {
          toValue: 1,
          duration: 260,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wave, {
          toValue: -1,
          duration: 460,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wave, {
          toValue: 0,
          duration: 260,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1400),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, []);

  const rotate = wave.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-18deg', '22deg'],
  });
  const scale = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });
  const textTranslate = textEnter.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={<OnboardingPrimaryButton label="Let's begin" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <View style={styles.copy}>
          <AnimatedText
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.heading,
              {
                opacity: textEnter,
                transform: [{ translateY: textTranslate }],
              },
            ]}
          >
            Hey, {displayName}.
          </AnimatedText>

          <AnimatedText style={[styles.subtitle, { opacity: textEnter }]}>
            It's good to meet you! We'll ask you a few questions to make your experience better.
          </AnimatedText>
        </View>

        <Animated.View
          style={[
            styles.wave,
            {
              opacity: enter,
              transform: [{ scale }, { rotate }],
            },
          ]}
        >
          <WaveHandIllustration />
        </Animated.View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  wave: {
    width: WAVE_SIZE,
    height: WAVE_SIZE,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  heading: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -1,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
