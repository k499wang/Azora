import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import {
  ONBOARDING_VISUAL_MAX_WIDTH,
  scaleVisual,
} from '../onboardingVisualScale';

interface BaselineIntroScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const ILLUSTRATION_SIZE = Math.min(
  scaleVisual(290),
  ONBOARDING_VISUAL_MAX_WIDTH,
);

export default function BaselineIntroScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: BaselineIntroScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      enableNavigationHaptics={false}
      footer={
        <OnboardingPrimaryButton
          label="Read my heart"
          onPress={onContinue}
          enableHaptics={false}
        />
      }
    >
      <View style={styles.stage}>
        <Image
          source={getOnboardingImageSource('heartHealthMascot')}
          style={styles.illustration}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
        />
        <View style={styles.copy}>
          <Text style={styles.headline}>Let’s get to know your heart.</Text>
          <Text style={styles.sub}>
            A quick camera reading estimates your current heart rate and gives
            you a personal baseline to follow over time.
          </Text>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  illustration: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.text.primary,
    textAlign: 'center',
  },
  sub: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
