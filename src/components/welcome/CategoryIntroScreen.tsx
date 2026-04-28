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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { BreathOrb } from './BreathOrb';

interface Props {
  onContinue: () => void;
}

const PULSE_MS = 3600;

export function CategoryIntroScreen({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const orbSize = Math.min(Dimensions.get('window').width * 0.72, 320);

  const pulse = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

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

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing['3xl'] }]}>
      <View style={styles.copyTop}>
        <Text style={styles.eyebrow}>Introducing</Text>
        <Text style={styles.headline}>
          The first vitals-backed breathing app.
        </Text>
        <Text style={styles.subhead}>
          Clinically-grounded protocols. Real-time HRV biofeedback. Measure the
          exact moment your nervous system shifts.
        </Text>
      </View>

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
          onPress={onContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>Begin</Text>
        </Pressable>
      </View>
    </View>
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
  eyebrow: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.brand,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  headline: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 30,
    lineHeight: 38,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subhead: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 340,
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
