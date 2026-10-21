import { useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { OnboardingPreset } from '../../../lib/onboardingPreset';
import { personalizedPaywallPlan } from '../../../lib/paywall/paywallLongForm';
import { spacing } from '../../../theme/spacing';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import { Text } from '../../common/Text';
import { scaleVisual } from '../onboardingVisualScale';
import type { OnboardingIntent } from '../types';
import { paywallStepStyles as styles } from './paywallStepStyles';

export function PaywallFreeTrialHeroStep({
  planPreset,
  intent = 'other',
  name,
  goalPhrase,
}: {
  planPreset: OnboardingPreset;
  intent?: OnboardingIntent;
  name?: string;
  goalPhrase?: string | null;
}) {
  const [today] = useState(() => new Date());
  const plan = personalizedPaywallPlan(planPreset, intent, name, goalPhrase, today);

  return (
    <View style={[styles.stepContainer, heroStyles.container]}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          {`We want you to try your ${plan.planName} plan `}
          <Text style={styles.stepTitleBrand}>for free!</Text>
        </Text>
      </View>
      <View style={heroStyles.gift} accessible={false} importantForAccessibility="no-hide-descendants">
        <Image source={getOnboardingImageSource('azoGiftBox')} style={heroStyles.image} contentFit="contain" transition={0} cachePolicy="memory-disk" />
      </View>
    </View>
  );
}

export default PaywallFreeTrialHeroStep;

const heroStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  gift: {
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  image: {
    width: scaleVisual(240),
    height: scaleVisual(240),
  },
});
