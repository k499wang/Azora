import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ContinuousHaptics } from '../../native/continuousHaptics';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface Props {
  onFinish: () => void;
}

const INHALE_MS = 1800;
const EXHALE_MS = 2600;
const FADE_MS = 280;
const HEADLINE_FADE_MS = 380;
const INHALE_TEXT_VISIBLE_MS = HEADLINE_FADE_MS + INHALE_MS + HEADLINE_FADE_MS;

const INHALE_GRADIENT: [string, string] = [colors.primary.blue400, colors.primary.blue700];
const EXHALE_GRADIENT: [string, string] = [colors.orange[400], colors.orange[700]];

interface ParticleDef {
  x: number;
  y: number;
  rise: number;
  size: number;
  opacity: number;
}

const PARTICLES: ParticleDef[] = [
  { x: 0.12, y: 0.62, rise: -0.16, size: 3, opacity: 0.3 },
  { x: 0.22, y: 0.72, rise: -0.20, size: 2, opacity: 0.2 },
  { x: 0.32, y: 0.58, rise: -0.14, size: 4, opacity: 0.35 },
  { x: 0.42, y: 0.68, rise: -0.18, size: 2.5, opacity: 0.25 },
  { x: 0.52, y: 0.64, rise: -0.22, size: 3.5, opacity: 0.3 },
  { x: 0.62, y: 0.75, rise: -0.15, size: 2, opacity: 0.2 },
  { x: 0.72, y: 0.60, rise: -0.19, size: 4, opacity: 0.35 },
  { x: 0.82, y: 0.70, rise: -0.17, size: 2.5, opacity: 0.25 },
  { x: 0.18, y: 0.78, rise: -0.21, size: 3, opacity: 0.2 },
  { x: 0.68, y: 0.66, rise: -0.16, size: 2, opacity: 0.25 },
  { x: 0.38, y: 0.74, rise: -0.18, size: 3.5, opacity: 0.3 },
  { x: 0.88, y: 0.63, rise: -0.14, size: 2, opacity: 0.2 },
];

type Phase = 'inhale' | 'exhale';

export function WelcomeIntro({ onFinish }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>('inhale');

  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const gradientOpacity = useRef(new Animated.Value(0)).current;
  const gradientAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const particleAnims = useRef(PARTICLES.map(() => new Animated.Value(0))).current;

  const finishedRef = useRef(false);
  const stopInhaleVibration = () => {
    if (Platform.OS === 'ios') {
      ContinuousHaptics.stop();
    } else {
      Vibration.cancel();
    }
  };

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    stopInhaleVibration();
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onFinish();
    });
  };

  useEffect(() => {
    headlineOpacity.setValue(0);

    const isInhale = phase === 'inhale';
    const duration = isInhale ? INHALE_MS : EXHALE_MS;

    if (isInhale && isHapticsEnabled()) {
      if (Platform.OS === 'ios') {
        ContinuousHaptics.start(INHALE_TEXT_VISIBLE_MS);
      } else {
        Vibration.vibrate(INHALE_TEXT_VISIBLE_MS);
      }
    }

    // Ambient gradient shift synced to breath phase
    gradientAnimRef.current?.stop();
    gradientAnimRef.current = Animated.timing(gradientOpacity, {
      toValue: isInhale ? 1 : 0,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });
    gradientAnimRef.current.start();

    // Particles rise on inhale, settle on exhale
    particleAnims.forEach((anim) => {
      anim.stopAnimation();
      Animated.timing(anim, {
        toValue: isInhale ? 1 : 0,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    const textAnimation = Animated.sequence([
      Animated.timing(headlineOpacity, {
        toValue: 1,
        duration: HEADLINE_FADE_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(duration),
      Animated.timing(headlineOpacity, {
        toValue: 0,
        duration: HEADLINE_FADE_MS,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    textAnimation.start(({ finished }) => {
      if (!finished) return;
      stopInhaleVibration();
      if (isInhale) {
        setPhase('exhale');
      } else {
        finish();
      }
    });

    return () => {
      textAnimation.stop();
      gradientAnimRef.current?.stop();
      particleAnims.forEach((anim) => anim.stopAnimation());
      stopInhaleVibration();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <Animated.View
      style={[styles.root, { opacity: screenOpacity }]}
      pointerEvents="box-none"
    >
      {/* Ambient breath gradient */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={EXHALE_GRADIENT} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientOpacity }]}>
          <LinearGradient colors={INHALE_GRADIENT} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>

      {/* Rising / falling breath particles */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
        {PARTICLES.map((p, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x * screenWidth,
              top: p.y * screenHeight,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: colors.neutral[0],
              opacity: p.opacity,
              transform: [
                {
                  translateY: particleAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, p.rise * screenHeight],
                  }),
                },
              ],
            }}
          />
        ))}
      </View>

      <View style={styles.copy}>
        <Animated.Text style={[styles.headline, { opacity: headlineOpacity }]}>
          {phase === 'inhale' ? 'Breathe in' : 'Breathe out'}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.primary,
    zIndex: 900,
    elevation: 900,
  },
  copy: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 1,
    elevation: 1,
  },
  headline: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },
});
