import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { BreathOrb } from './BreathOrb';

interface Props {
  onContinue: () => void;
}

const PULSE_MS = 3600;

export function CategoryIntroScreen({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const orbSize = Math.min(Dimensions.get('window').width * 0.42, 180);

  const pulse = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const handleBegin = () => {
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    Animated.timing(exit, {
      toValue: 0,
      duration: 320,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onContinue());
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: PULSE_MS / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: PULSE_MS / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1,
          duration: PULSE_MS / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(halo, {
          toValue: 0,
          duration: PULSE_MS / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse, halo]);

  const orbScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.04] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });

  const screenOpacity = Animated.multiply(enter, exit);
  const headlineTranslate = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  return (
    <Animated.View
      style={[
        styles.root,
        { paddingTop: insets.top + spacing['3xl'], opacity: screenOpacity },
      ]}
    >
      <Animated.View
        style={[styles.copyTop, { transform: [{ translateY: headlineTranslate }] }]}
      >
        <Text style={styles.headline}>
          Meet Azora,{'\n'}your breathing{'\n'}assistant.
        </Text>
      </Animated.View>

      <View style={styles.orbWrap} pointerEvents="none">
        <Animated.View
          style={[
            styles.haloLayer,
            { opacity: haloOpacity, transform: [{ scale: haloScale }] },
          ]}
        >
          <View
            style={[
              styles.haloRing,
              {
                width: orbSize * 1.25,
                height: orbSize * 1.25,
                borderRadius: (orbSize * 1.25) / 2,
              },
            ]}
          />
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: orbScale }] }}>
          <BreathOrb size={orbSize} />
        </Animated.View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          onPress={handleBegin}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>Begin</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
  },
  copyTop: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  headline: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -0.5,
    color: colors.text.primary,
    textAlign: 'center',
  },
  orbWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloRing: {
    borderWidth: 1,
    borderColor: colors.primary.blue300,
    backgroundColor: colors.primary.blue100,
    opacity: 0.5,
  },
  bottom: {
    alignItems: 'stretch',
  },
  cta: {
    backgroundColor: colors.primary.blue600,
    borderRadius: 999,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    backgroundColor: colors.primary.blue700,
  },
  ctaText: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 16,
    color: colors.text.inverse,
  },
});
