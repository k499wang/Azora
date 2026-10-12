import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Text } from '../../common/Text';
import LaurelStat from '../../common/LaurelStat';
import Icon from '../../common/icons/Icon';
import TaskIllustration from '../../common/icons/TaskIllustration';
import { colors } from '../../../theme/colors';
import type { PaywallFeature } from '../../paywall/PaywallFeatureList';
import { scaleVisual } from '../onboardingVisualScale';
import { paywallStepStyles as styles } from './paywallStepStyles';

const AZO_HEART = require('../../../../assets/mascot/azo-heart.png');

const AZO_WIDTH_SHARE = 0.43;
const AZO_MAX = scaleVisual(160);

const BENEFITS: { icon: ComponentProps<typeof TaskIllustration>['name']; title: string }[] = [
  { icon: 'calendar', title: 'Daily routines personalized to your goals' },
  { icon: 'todo-plan', title: 'A 28-day reset to build better habits and make daily life feel easier' },
  { icon: 'heart', title: 'ADHD-friendly steps to make routines easier to stick with' },
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
        {BENEFITS.map(({ icon, title }) => (
          <View key={title} style={styles.benefitsRow}>
            <View style={styles.benefitsIcon}>
              <TaskIllustration name={icon} size={scaleVisual(44)} />
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
