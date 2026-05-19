import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import HarvardLogo from '../../../../assets/logos/harvard.svg';

interface ScienceCredibilityScreenProps {
  stepIndex: number;
  stepCount: number;
  name: string | null;
  intentTitle: string | null;
  onContinue: () => void;
  onBack: () => void;
}

type LogoEntry = {
  id: string;
  height: number;
  aspectRatio: number;
  source?: number;
  Component?: React.FC<{ width: number; height: number; viewBox?: string }>;
  viewBox?: string;
};

const LOGOS: LogoEntry[] = [
  { id: 'harvard', Component: HarvardLogo, height: 72, aspectRatio: 600 / 165, viewBox: '0 0 600 165' },
  { id: 'oxford', source: require('../../../../assets/logos/oxford.png'), height: 72, aspectRatio: 823 / 257 },
  { id: 'cambridge', source: require('../../../../assets/logos/cambridge.png'), height: 60, aspectRatio: 1558 / 332 },
];

export default function ScienceCredibilityScreen({
  stepIndex,
  stepCount,
  name,
  onContinue,
  onBack,
}: ScienceCredibilityScreenProps) {
  const greeting = name ? `${name}, you're` : "You're";
  const rowAnims = useRef(LOGOS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    Animated.stagger(
      160,
      rowAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 480,
          delay: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [rowAnims]);

  return (
    <OnboardingScreenLayout
      title={`${greeting} in good hands.`}
      subtitle="We're backed by science from the world's most respected research institutions."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.container}>
        {LOGOS.map(({ id, source, Component, height, aspectRatio, viewBox }, i) => (
          <Animated.View
            key={id}
            style={[
              styles.row,
              {
                opacity: rowAnims[i],
                transform: [
                  {
                    translateY: rowAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {Component ? (
              <Component width={height * aspectRatio} height={height} viewBox={viewBox} />
            ) : (
              <Image
                source={source}
                style={[styles.logo, { height, aspectRatio }]}
                resizeMode="contain"
              />
            )}
            {i < LOGOS.length - 1 && <View style={styles.divider} />}
          </Animated.View>
        ))}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  row: {
    paddingVertical: spacing.lg,
    position: 'relative',
    alignItems: 'center',
  },
  logo: {
    alignSelf: 'center',
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },
});
