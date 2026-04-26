import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingStepProps } from '../types';
import { colors } from '../../../theme/colors';
import { spacing, padding } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export function WelcomeScreen({ onNext }: OnboardingStepProps) {
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.08,
            duration: 4000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.95,
            duration: 4000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.9,
            duration: 4000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.55,
            duration: 4000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <View style={styles.hero}>
        <Animated.View style={[styles.orbOuter, { transform: [{ scale }], opacity }]} />
        <Animated.View style={[styles.orbMid, { transform: [{ scale }] }]} />
        <View style={styles.orbInner} />
      </View>

      <View style={styles.content}>
        <Text style={styles.eyebrow}>AZORA</Text>
        <Text style={styles.title}>Calm your mind in 5 minutes.</Text>
        <Text style={styles.subtitle}>
          Science-backed breathwork that lowers stress, sharpens focus, and helps you sleep —
          measured by your heart, not guesswork.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onNext}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: padding.screen.horizontal,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.primary.blue100,
  },
  orbMid: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.primary.blue400,
    opacity: 0.55,
  },
  orbInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary.blue600,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.text.brand,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.display.display3,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  button: {
    backgroundColor: colors.primary.blue600,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...typography.button.large,
    color: colors.text.inverse,
  },
});
