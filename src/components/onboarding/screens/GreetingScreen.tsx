import { AnimatedText } from '../../common/Text';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { scaleVisual } from '../onboardingVisualScale';

interface GreetingScreenProps {
  name: string;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const KOALA_WIDTH = scaleVisual(290);
const KOALA_HEIGHT = KOALA_WIDTH;

/**
 * The greeting at its intended size, and the width that size was drawn for.
 *
 * The line is "Hey, <name>.", so its width is the user's to decide. Sizing it
 * from the window keeps the phone it was designed on at 44 and only steps down
 * on narrower ones, which leaves `adjustsFontSizeToFit` as a floor for a long
 * name rather than the thing that sets the size on every device.
 */
const HEADING_SIZE = 44;
const HEADING_REFERENCE_WIDTH = 393;
const HEADING_MIN_SIZE = 32;

function headingSizeFor(width: number): number {
  const scaled = Math.round((HEADING_SIZE * width) / HEADING_REFERENCE_WIDTH);
  return Math.min(HEADING_SIZE, Math.max(HEADING_MIN_SIZE, scaled));
}

export default function GreetingScreen({
  name,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: GreetingScreenProps) {
  const displayName = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return 'there';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }, [name]);

  const { width } = useWindowDimensions();
  const headingSize = headingSizeFor(width);

  const textEnter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entrance = Animated.timing(textEnter, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    entrance.start(({ finished }) => {
      if (finished && isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    });

    return () => entrance.stop();
  }, [textEnter]);

  const textTranslate = textEnter.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Let's begin" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.mascot,
            {
              opacity: textEnter,
              transform: [{ translateY: textTranslate }],
            },
          ]}
          accessible
          accessibilityRole="image"
          accessibilityLabel="Azo waving hello"
        >
          <Image
            source={getOnboardingImageSource('azoWave')}
            style={styles.koala}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={0}
          />
        </Animated.View>

        <View style={styles.copy}>
          <AnimatedText
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={[
              styles.heading,
              {
                fontSize: headingSize,
                lineHeight: Math.round(headingSize * 1.18),
                opacity: textEnter,
                transform: [{ translateY: textTranslate }],
              },
            ]}
          >
            Hey, {displayName}.
          </AnimatedText>

          <AnimatedText
            style={[
              styles.subtitle,
              {
                opacity: textEnter,
                transform: [{ translateY: textTranslate }],
              },
            ]}
          >
            It's good to meet you. Next, a bit about how you've been feeling
            lately.
          </AnimatedText>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing['2xl'],
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  koala: {
    width: '100%',
    height: '100%',
  },
  mascot: {
    width: KOALA_WIDTH,
    height: KOALA_HEIGHT,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  heading: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    letterSpacing: -1,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
