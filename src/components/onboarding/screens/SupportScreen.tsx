import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import { spacing } from '../../../theme/spacing';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import {
  ONBOARDING_VISUAL_MAX_WIDTH,
  scaleVisual,
} from '../onboardingVisualScale';

interface SupportScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const ILLUSTRATION_WIDTH = Math.min(
  scaleVisual(348),
  ONBOARDING_VISUAL_MAX_WIDTH,
);

export default function SupportScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: SupportScreenProps) {
  return (
    <OnboardingScreenLayout
      title="Your first days are on us."
      subtitle="If it earns a place in your day, your support is what pays the mental health experts behind it."
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      centerBody
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <Image
          source={getOnboardingImageSource('wellbeingVsCoffee')}
          style={styles.illustration}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
        />
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  illustration: {
    width: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_WIDTH,
  },
});
