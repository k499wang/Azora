import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';
import { Text } from '../../common/Text';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import Icon from '../../common/icons/Icon';
import PaywallFeatureList from '../../paywall/PaywallFeatureList';
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
    title: 'I stopped lying awake at 2am',
    quote:
      'My head would not switch off at night. Four minutes of the wind down and I am out before I finish it.',
    author: 'Maya Rivera',
    avatar: 'testimonialMaya',
  },
  {
    title: 'The stress does not stack up now',
    quote:
      'I used to carry every bad meeting into the evening. One reset at my desk and my heart rate is back down before I get home.',
    author: 'Jackie Koch',
    avatar: 'testimonialDaniel',
  },
  {
    title: 'Calmer without adding another hour',
    quote:
      'I do not have time for a long meditation. Five minutes a day and I feel steadier through the whole week.',
    author: 'Priya Shah',
    avatar: 'testimonialPriya',
  },
  {
    title: 'I finally know how my heart is doing',
    quote:
      'My heart rate and my Azora Score are in one place, so checking everything takes seconds.',
    author: 'Nina Alvarez',
    avatar: 'testimonialNina',
  },
];

export function PaywallBenefitsStep() {
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
        <Text style={styles.unlockTitle}>Your plan includes</Text>
        <PaywallFeatureList />
      </View>
    </View>
  );
}

export default PaywallBenefitsStep;
