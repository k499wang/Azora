import { Text } from '../common/Text';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import ConfettiFall from '../common/ConfettiFall';
import AzoAnimation from '../common/AzoAnimation';
import { scaleVisual } from './onboardingVisualScale';

/**
 * How long onboarding holds the pact celebration before the paywall, counted
 * from the seal tap: Azo's 2s dance plus a beat on the last pose to read the
 * line under it.
 */
export const CELEBRATION_HOLD_MS = 5000;

interface CelebrationOverlayProps {
  title?: string;
}

/* ─── CelebrationOverlay ─── */
export default function CelebrationOverlay({
  title = 'This is a really good start. Well done.',
}: CelebrationOverlayProps) {
  const insets = useSafeAreaInsets();
  const bgFade = useRef(new Animated.Value(0)).current;
  const azoScale = useRef(new Animated.Value(0.6)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textShift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const haptics = isHapticsEnabled();
    let secondBuzz: ReturnType<typeof setTimeout> | null = null;

    if (haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      secondBuzz = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }, 220);
    }

    const entrance = Animated.parallel([
      Animated.timing(bgFade, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(azoScale, {
        toValue: 1,
        tension: 90,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);

    const settle = Animated.sequence([
      Animated.delay(340),
      Animated.parallel([
        Animated.timing(textFade, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textShift, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    entrance.start();
    settle.start();

    return () => {
      if (secondBuzz != null) clearTimeout(secondBuzz);
      entrance.stop();
      settle.stop();
    };
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          opacity: bgFade,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          paddingLeft: insets.left + spacing.xl,
          paddingRight: insets.right + spacing.xl,
        },
      ]}
    >
      <ConfettiFall />

      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale: azoScale }] }}>
          <AzoAnimation pose="celebrate" width={AZO_WIDTH} />
        </Animated.View>

        <Animated.View
          style={[
            styles.copy,
            { opacity: textFade, transform: [{ translateY: textShift }] },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const AZO_WIDTH = scaleVisual(260);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  copy: {
    alignItems: 'center',
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
