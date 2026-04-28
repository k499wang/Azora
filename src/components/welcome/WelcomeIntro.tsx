import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { BreathOrb } from './BreathOrb';

interface Props {
  onFinish: () => void;
}

const INHALE_MS = 1800;
const EXHALE_MS = 2600;
const FADE_MS = 280;
const HEADLINE_FADE_MS = 380;
const SKIP_FADE_MS = 1000;
const REST_SCALE = 0.78;
const FULL_SCALE = 1;

type Phase = 'inhale' | 'exhale';

export function WelcomeIntro({ onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('inhale');

  const orbScale = useRef(new Animated.Value(REST_SCALE)).current;
  const haloOpacity = useRef(new Animated.Value(0.5)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const skipOpacity = useRef(new Animated.Value(1)).current;

  const orbSize = Dimensions.get('window').width * 0.78;

  const finishedRef = useRef(false);
  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onFinish();
    });
  };

  useEffect(() => {
    Animated.timing(skipOpacity, {
      toValue: 0,
      duration: 400,
      delay: SKIP_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [skipOpacity]);

  useEffect(() => {
    headlineOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(headlineOpacity, {
        toValue: 1,
        duration: HEADLINE_FADE_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const isInhale = phase === 'inhale';
    const duration = isInhale ? INHALE_MS : EXHALE_MS;

    const orb = Animated.timing(orbScale, {
      toValue: isInhale ? FULL_SCALE : REST_SCALE,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });

    const halo = Animated.timing(haloOpacity, {
      toValue: isInhale ? 1 : 0.45,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });

    const composite = Animated.parallel([orb, halo]);
    composite.start(({ finished }) => {
      if (!finished) return;
      Animated.timing(headlineOpacity, {
        toValue: 0,
        duration: HEADLINE_FADE_MS,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (isInhale) {
          setPhase('exhale');
        } else {
          finish();
        }
      });
    });

    return () => composite.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <Animated.View
      style={[styles.root, { opacity: screenOpacity }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.skip,
          { top: insets.top + spacing.sm, opacity: skipOpacity },
        ]}
      >
        <Pressable onPress={finish} hitSlop={12}>
          <Text style={styles.skipText}>Skip intro</Text>
        </Pressable>
      </Animated.View>

      <View style={[styles.copy, { paddingTop: insets.top + spacing['4xl'] }]}>
        <Animated.Text style={[styles.headline, { opacity: headlineOpacity }]}>
          {phase === 'inhale' ? 'Breathe in' : 'Breathe out'}
        </Animated.Text>
      </View>

      <View style={styles.orbWrap} pointerEvents="none">
        <Animated.View
          style={[
            styles.haloLayer,
            {
              opacity: haloOpacity,
              transform: [{ scale: orbScale }],
            },
          ]}
        >
          <BreathOrb size={orbSize} />
        </Animated.View>
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
    justifyContent: 'space-between',
  },
  skip: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 1,
  },
  skipText: {
    ...typography.label.small,
    color: colors.text.tertiary,
  },
  orbWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  headline: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
});
