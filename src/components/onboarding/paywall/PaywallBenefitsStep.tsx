import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';
import { Text } from '../../common/Text';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import Icon from '../../common/icons/Icon';
import PaywallFeatureList, {
  type PaywallFeature,
} from '../../paywall/PaywallFeatureList';
import {
  getOnboardingImageSource,
  type OnboardingImageKey,
} from '../../../services/images/onboardingImageCache';
import {
  TESTIMONIAL_CARD_WIDTH,
  paywallStepStyles as styles,
} from './paywallStepStyles';

// Mockup content. Replace with verbatim App Store reviews, real reviewer names,
// and real headshots before shipping.
const testimonials: Array<{
  title: string;
  quote: string;
  author: string;
  avatar: OnboardingImageKey;
}> = [
  {
    title: 'My new bedtime routine',
    quote:
      'I started using Azora when I could not switch my brain off at night. Now winding down is something I look forward to instead of something I dread.',
    author: 'Maya Rivera',
    avatar: 'testimonialMaya',
  },
  {
    title: 'The stress does not follow me home',
    quote:
      'I used to carry every hard day into the evening. One reset at my desk and I walk in the door as myself again.',
    author: 'Jackie Koch',
    avatar: 'testimonialDaniel',
  },
  {
    title: 'Looking after myself finally fits',
    quote:
      'I do not have an hour to give myself. Five minutes a day turned out to be enough to feel steadier all week.',
    author: 'Priya Shah',
    avatar: 'testimonialPriya',
  },
  {
    title: 'I can see my body settle',
    quote:
      'I take a heart rate reading before and after. Watching the number come down is what convinced me this was doing something real.',
    author: 'Nina Alvarez',
    avatar: 'testimonialNina',
  },
];

interface PaywallBenefitsStepProps {
  features?: PaywallFeature[];
  name?: string;
  hasTrial: boolean;
  trialDuration: string;
}

export function PaywallBenefitsStep({
  features,
  name,
  hasTrial,
  trialDuration,
}: PaywallBenefitsStepProps) {
  const trimmedName = name?.trim();
  const unlockTitle = hasTrial
    ? `${trimmedName ? `${trimmedName}, your` : 'Your'} ${trialDuration} trial unlocks`
    : `${trimmedName ? `${trimmedName}, your` : 'Your'} plan includes`;

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          We want you to try{ '\n' }
          Azora <Text style={styles.stepTitleBrand}>for free.</Text>
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={TESTIMONIAL_CARD_WIDTH + spacing.sm}
        snapToAlignment="start"
        style={styles.testimonialScroll}
        contentContainerStyle={styles.testimonialRow}
      >
        {testimonials.map((testimonial) => (
          <View key={testimonial.author} style={styles.testimonialCard}>
            <View style={styles.testimonialRating}>
              <View style={styles.testimonialStars}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <Icon key={index} name="star" size={20} color={colors.orange[500]} />
                ))}
              </View>
              <Text style={styles.testimonialRatingValue}>5.0</Text>
            </View>
            <Text style={styles.testimonialTitle}>{testimonial.title}</Text>
            <Text style={styles.testimonialQuote}>{testimonial.quote}</Text>
            <View style={styles.testimonialAttribution}>
              <Image
                source={getOnboardingImageSource(testimonial.avatar)}
                style={styles.testimonialAvatar}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
                accessibilityLabel={`${testimonial.author} profile photo`}
              />
              <Text style={styles.testimonialAuthor}>{testimonial.author}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.unlockSection}>
        <Text style={styles.unlockTitle}>{unlockTitle}</Text>
        <PaywallFeatureList features={features} />
      </View>
    </View>
  );
}

export default PaywallBenefitsStep;
