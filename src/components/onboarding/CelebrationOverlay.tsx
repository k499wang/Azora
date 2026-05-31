import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';

interface CelebrationOverlayProps {
  title?: string;
  subtitle?: string;
}

/* ─── Confetti ─── */
const CONFETTI_COLORS = [
  colors.primary.blue400,
  colors.primary.blue600,
  colors.success[500],
  colors.orange[400],
  colors.orange[500],
  colors.primary.blue300,
];

const CONFETTI_COUNT = 26;

const CONFETTI_CONFIG = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
  xPercent: 15 + Math.random() * 70, // keep within middle 70%
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: Math.random() * 250,
  duration: 1600 + Math.random() * 1400,
  drift: (Math.random() - 0.5) * 280,
  rotation: (Math.random() > 0.5 ? 1 : -1) * (200 + Math.random() * 400),
  size: 6 + Math.random() * 6,
}));

function ConfettiPiece({
  xPercent,
  color,
  delay,
  duration,
  drift,
  rotation,
  size,
}: {
  xPercent: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  rotation: number;
  size: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 420],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drift],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${rotation}deg`],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        confettiStyles.piece,
        {
          left: `${xPercent}%`,
          width: size,
          height: size * 0.65,
          borderRadius: size * 0.15,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    />
  );
}

/* ─── CelebrationOverlay ─── */
export default function CelebrationOverlay({
  title = "You're in.",
  subtitle = 'Your pact is set.',
}: CelebrationOverlayProps) {
  const bgFade = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.4)).current;
  const ringPulse = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.6)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textShift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const haptics = isHapticsEnabled();

    if (haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }, 220);
    }

    Animated.parallel([
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
    ]).start();

    Animated.sequence([
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
    ]).start();

    Animated.loop(
      Animated.timing(ringPulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ).start();
  }, []);

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
      style={[styles.overlay, { opacity: bgFade }]}
    >
      {/* Confetti */}
      <View style={styles.confettiWrap} pointerEvents="none">
        {CONFETTI_CONFIG.map((c, i) => (
          <ConfettiPiece key={i} {...c} />
        ))}
      </View>

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
            <Animated.Text
              style={[
                styles.check,
                { opacity: checkOpacity, transform: [{ scale: checkScale }] },
              ]}
            >
              ✓
            </Animated.Text>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.copy,
            { opacity: textFade, transform: [{ translateY: textShift }] },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const RING_SIZE = 128;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
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
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontSize: 64,
    lineHeight: 72,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  copy: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 28,
    lineHeight: 34,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});

const confettiStyles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: '15%',
  },
});
