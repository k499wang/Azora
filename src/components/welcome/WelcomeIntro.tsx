import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
const SKIP_FADE_MS = 1000;
const INHALE_TEXT_VISIBLE_MS = HEADLINE_FADE_MS + INHALE_MS + HEADLINE_FADE_MS;

type Phase = 'inhale' | 'exhale';

export function WelcomeIntro({ onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('inhale');

  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const skipOpacity = useRef(new Animated.Value(1)).current;

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
    Animated.timing(skipOpacity, {
      toValue: 0,
      duration: 400,
      delay: SKIP_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [skipOpacity]);

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
      stopInhaleVibration();
    };
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
  skip: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 1,
  },
  skipText: {
    ...typography.label.small,
    color: colors.text.tertiary,
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
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
});
