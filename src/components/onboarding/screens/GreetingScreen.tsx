import { AnimatedText } from '../../common/Text';
import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';
import { useWhileVisible } from '../../../hooks/useWhileVisible';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { scaleVisual } from '../onboardingVisualScale';
import { entranceTiming } from '../entranceTiming';
import AzoGreeting from '../AzoGreeting';

interface GreetingScreenProps {
  name: string;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const KOALA_WIDTH = scaleVisual(290);
const KOALA_HEIGHT = KOALA_WIDTH * (578 / 600);

/**
 * The greeting at its intended size, and the width that size was drawn for.
 *
 * The line is "Hey, <name>.", so its width is the user's to decide. Sizing it
 * from the window keeps the phone it was designed on at 44 and only steps down
 * on narrower ones; a name too long for one line wraps onto the second.
 *
 * Deliberately not `adjustsFontSizeToFit`: on iOS it measures against the
 * height it is given as well as the width, and this heading sits in a centred
 * flex box with no fixed height, so it shrank the greeting to a fraction of its
 * size on a real device while reading correctly in a fixed-height preview.
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
  const reducedMotion = useReducedMotion();
  const headingSize = headingSizeFor(width);

  const entranceProgress = useRef(new Animated.Value(0)).current;
  const entranceFinished = useRef(false);
  const [imageDisplayed, setImageDisplayed] = useState(false);

  useWhileVisible(() => {
    if (!imageDisplayed || entranceFinished.current) return () => {};
    const entrance = Animated.timing(entranceProgress, {
      toValue: 1,
      duration: reducedMotion ? 0 : entranceTiming.visual,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    entrance.start(({ finished }) => {
      if (finished) entranceFinished.current = true;
      if (finished && isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    });

    return () => entrance.stop();
  }, [imageDisplayed, entranceProgress, reducedMotion]);

  const contentTranslate = entranceProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  return (
    <Animated.View
      style={[styles.screen, { opacity: entranceProgress }]}
      pointerEvents={imageDisplayed ? 'auto' : 'none'}
    >
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
                transform: [{ translateY: contentTranslate }],
              },
            ]}
          >
            <AzoGreeting width={KOALA_WIDTH} onReady={() => setImageDisplayed(true)} />
          </Animated.View>

          <View style={styles.copy}>
            <AnimatedText
              numberOfLines={2}
              style={[
                styles.heading,
                {
                  fontSize: headingSize,
                  lineHeight: Math.round(headingSize * 1.18),
                  transform: [{ translateY: contentTranslate }],
                },
              ]}
            >
              Hey, {displayName}.
            </AnimatedText>

            <AnimatedText
              style={[
                styles.subtitle,
                {
                  transform: [{ translateY: contentTranslate }],
                },
              ]}
            >
              I'm glad we're in this together. Let's get both our lives back on track.
            </AnimatedText>
          </View>
        </View>
      </OnboardingScreenLayout>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
    letterSpacing: -1,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
