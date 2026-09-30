import { Image } from 'expo-image';
import { useWindowDimensions, View } from 'react-native';
import { Text } from '../../common/Text';
import LaurelStat from '../../common/LaurelStat';
import Icon, { type IconName } from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import type { PaywallFeature } from '../../paywall/PaywallFeatureList';
import { scaleVisual } from '../onboardingVisualScale';
import { paywallStepStyles as styles } from './paywallStepStyles';

const AZO_HEART = require('../../../../assets/mascot/azo-heart.png');

const AZO_WIDTH_SHARE = 0.43;
const AZO_MAX = scaleVisual(160);

const BENEFITS: { icon: IconName; title: string; color: string; backgroundColor: string }[] = [
  { icon: 'sparkle', title: 'A personalized plan built around your daily life', color: colors.playful.violet.ink, backgroundColor: colors.playful.violet.soft },
  { icon: 'waves', title: 'Quick guided exercises to help you find calm', color: colors.playful.teal.ink, backgroundColor: colors.playful.teal.soft },
  { icon: 'heart', title: 'Insights that help you understand your mood and recovery', color: colors.playful.amber.ink, backgroundColor: colors.playful.amber.soft },
];

interface PaywallBenefitsStepProps {
  features?: PaywallFeature[];
  name?: string;
  /** False when the plan has no trial, so "for free" is never an empty claim. */
  hasTrial: boolean;
}

export function PaywallBenefitsStep({
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
              Build a life that feels better with{' '}
              <Text style={styles.stepTitleBrand}>Azora.</Text>
            </>
          ) : (
            <>
              Everything in{' '}
              <Text style={styles.stepTitleBrand}>Azora.</Text>
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
      <View style={styles.benefitsList}>
        {BENEFITS.map(({ icon, title, color, backgroundColor }) => (
          <View key={title} style={styles.benefitsRow}>
            <View style={[styles.benefitsIcon, { backgroundColor }]}>
              <Icon name={icon} size={scaleVisual(23)} color={color} />
            </View>
            <Text style={styles.benefitsTitle}>{title}</Text>
          </View>
        ))}
      </View>
      <View style={styles.benefitsRating}>
        <LaurelStat scale="sm" value="Top rated" label="on the App Store" size={scaleVisual(52)} />
        <View style={styles.benefitsStars}>
          {Array.from({ length: 5 }, (_, index) => (
            <Icon key={index} name="star" size={scaleVisual(24)} color={colors.reward.gold} />
          ))}
        </View>
        <Text style={styles.benefitsReassurance}>No commitment, cancel anytime.</Text>
      </View>
    </View>
  );
}

export default PaywallBenefitsStep;
