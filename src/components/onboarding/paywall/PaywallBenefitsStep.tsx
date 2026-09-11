import { Image } from 'expo-image';
import { useWindowDimensions, View } from 'react-native';
import { Text } from '../../common/Text';
import type { PaywallFeature } from '../../paywall/PaywallFeatureList';
import { paywallStepStyles as styles } from './paywallStepStyles';

const AZO_HEART = require('../../../../assets/mascot/azo-heart.png');

/**
 * Azo takes the room the step has, rather than a fixed size that reads small on
 * a large phone and crowds a small one. Capped at the source art's own 512px so
 * he is never drawn past his resolution on a tablet.
 */
const AZO_WIDTH_SHARE = 0.64;
const AZO_MAX = 268;

interface PaywallBenefitsStepProps {
  features?: PaywallFeature[];
  name?: string;
  hasTrial: boolean;
  trialDuration: string;
}

/**
 * The trial length reads as a span of time here rather than as the adjective
 * the plan cards use: "the next 7 days", never "the next 7-day".
 */
function asDuration(trialDuration: string): string {
  const days = trialDuration.match(/^(\d+)[-\s]?day$/i);
  if (days) return `${days[1]} days`;
  return trialDuration;
}

export function PaywallBenefitsStep({
  hasTrial,
  trialDuration,
}: PaywallBenefitsStepProps) {
  const { width } = useWindowDimensions();
  const azoSize = Math.min(AZO_MAX, Math.round(width * AZO_WIDTH_SHARE));

  return (
    <View style={styles.benefitsStepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          {hasTrial ? (
            <>
              The next {asDuration(trialDuration)} of Azora Pro are{' '}
              <Text style={styles.stepTitleBrand}>on us for free.</Text>
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
