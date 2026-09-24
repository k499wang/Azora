import { Text } from '../common/Text';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import ConfettiFall from '../common/ConfettiFall';
import Icon from '../common/icons/Icon';
import { scaleVisual } from './onboardingVisualScale';

interface CelebrationOverlayProps {
  title?: string;
}

/* ─── CelebrationOverlay ─── */
export default function CelebrationOverlay({
  title = 'This is a really good start. Well done.',
}: CelebrationOverlayProps) {
  const insets = useSafeAreaInsets();
  const bgFade = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.4)).current;
  const ringPulse = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.6)).current;
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
      Animated.spring(ringScale, {
        toValue: 1,
        tension: 90,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);

    const settle = Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 110,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
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

  useWhileVisible(() => {
    ringPulse.setValue(0);
    const halo = Animated.loop(
      Animated.timing(ringPulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    halo.start();
    return () => halo.stop();
  }, [ringPulse]);

  const pulseScale = ringPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });
  const pulseOpacity = ringPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0],
  });

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
        <View style={styles.ringWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
            ]}
          />
          <Animated.View
            style={[styles.ring, { transform: [{ scale: ringScale }] }]}
          >
            <Animated.View
              style={{
                opacity: checkOpacity,
                transform: [{ scale: checkScale }],
              }}
            >
              <Icon
                name="check-bold"
                size={CHECK_SIZE}
                color={colors.text.inverse}
              />
            </Animated.View>
          </Animated.View>
        </View>

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

const RING_SIZE = scaleVisual(128);
const CHECK_SIZE = scaleVisual(64);

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
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.primary.blue200,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.primary.blue500,
    alignItems: 'center',
    justifyContent: 'center',
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
