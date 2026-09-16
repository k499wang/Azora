import { Image } from 'expo-image';
import { useWindowDimensions, View } from 'react-native';
import { Text } from '../../common/Text';
import type { PaywallFeature } from '../../paywall/PaywallFeatureList';
import type { OnboardingIntent } from '../types';
import { planNounForIntent } from '../../../lib/paywallPlanHighlights';
import { scaleVisual } from '../onboardingVisualScale';
import { paywallStepStyles as styles } from './paywallStepStyles';

const AZO_HEART = require('../../../../assets/mascot/azo-heart.png');

/**
 * Azo takes the room the step has, rather than a fixed size that reads small on
 * a large phone and crowds a small one. Capped at the source art's own 512px so
 * he is never drawn past his resolution on a tablet.
 */
const AZO_WIDTH_SHARE = 0.64;
const AZO_MAX = Math.min(512, scaleVisual(268));

interface PaywallBenefitsStepProps {
  features?: PaywallFeature[];
  name?: string;
  /** The goal the finished plan was built around, so the headline names it. */
  intent?: OnboardingIntent;
  /** False when the plan has no trial, so "for free" is never an empty claim. */
  hasTrial: boolean;
}

export function PaywallBenefitsStep({
  intent,
  hasTrial,
}: PaywallBenefitsStepProps) {
  const { width } = useWindowDimensions();
  const azoSize = Math.min(AZO_MAX, Math.round(width * AZO_WIDTH_SHARE));

  return (
    <View style={styles.benefitsStepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          {hasTrial ? (
            <>
              Azo wants you to try your personalized{' '}
              {planNounForIntent(intent)} plan{' '}
              <Text style={styles.stepTitleBrand}>for free</Text>
            </>
          ) : (
            <>
              Everything in{' '}
              <Text style={styles.stepTitleBrand}>Azora Pro.</Text>
            </>
          )}
        </Text>
      </View>

      <View style={styles.benefitsArtWrap}>
        <Image
          source={AZO_HEART}
          style={{ width: azoSize, height: azoSize }}
          contentFit="contain"
          accessible={false}
        />
      </View>
    </View>
  );
}

export default PaywallBenefitsStep;
