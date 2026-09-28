import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { spacing } from '../../../theme/spacing';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import {
  getOnboardingImageSource,
  type OnboardingImageKey,
} from '../../../services/images/onboardingImageCache';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import HarvardLogo from '../../../../assets/logos/harvard.svg';

interface ScienceCredibilityScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

type LogoEntry = {
  id: string;
  height: number;
  aspectRatio: number;
  imageKey?: OnboardingImageKey;
  Component?: React.FC<{ width: number; height: number; viewBox?: string }>;
  viewBox?: string;
};

const LOGOS: LogoEntry[] = [
  {
    id: 'harvard',
    Component: HarvardLogo,
    height: 72,
    aspectRatio: 600 / 165,
    viewBox: '0 0 600 165',
  },
  {
    id: 'oxford',
    imageKey: 'oxfordLogo',
    height: 72,
    aspectRatio: 823 / 257,
  },
  {
    id: 'cambridge',
    imageKey: 'cambridgeLogo',
    height: 60,
    aspectRatio: 861 / 180,
  },
];

export default function ScienceCredibilityScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: ScienceCredibilityScreenProps) {
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
      title="Azora is built on what science says works."
      subtitle="All of our content is backed by science from the world's most respected research institutions."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.container}>
        {LOGOS.map(({ id, imageKey, Component, height, aspectRatio, viewBox }, i) => (
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
              <Component
                width={height * aspectRatio}
                height={height}
                viewBox={viewBox}
              />
            ) : imageKey ? (
              <Image
                source={getOnboardingImageSource(imageKey)}
                style={[styles.logo, { height, aspectRatio }]}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={0}
              />
            ) : null}
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
    alignItems: 'center',
  },
  logo: {
    alignSelf: 'center',
  },
});
