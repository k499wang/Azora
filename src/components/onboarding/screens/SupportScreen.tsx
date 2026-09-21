import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import { isShortScreen } from '../../../theme/breakpoints';
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
  onBack?: () => void;
}

const ILLUSTRATION_WIDTH = Math.min(
  scaleVisual(348),
  ONBOARDING_VISUAL_MAX_WIDTH,
);
const COMPACT_ILLUSTRATION_WIDTH = Math.min(
  scaleVisual(270),
  ONBOARDING_VISUAL_MAX_WIDTH,
);

export default function SupportScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: SupportScreenProps) {
  const { height } = useWindowDimensions();
  const compact = isShortScreen(height);

  return (
    <OnboardingScreenLayout
      title="Azora is free to try."
      subtitle="If it earns a place in your day, your support is what pays the mental health experts behind it."
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      centerBody={!compact}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={[styles.stage, compact && styles.stageCompact]}>
        <Image
          source={getOnboardingImageSource('wellbeingVsCoffee')}
          style={[styles.illustration, compact && styles.illustrationCompact]}
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
  stageCompact: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  illustration: {
    width: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_WIDTH,
  },
  illustrationCompact: {
    width: COMPACT_ILLUSTRATION_WIDTH,
    height: COMPACT_ILLUSTRATION_WIDTH,
  },
});
