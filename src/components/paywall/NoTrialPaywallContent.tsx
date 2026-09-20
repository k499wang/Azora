import { Image } from 'expo-image';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { card } from '../../theme/card';
import PaywallFeatureList, { type PaywallFeature } from './PaywallFeatureList';
import {
  getOnboardingImageSource,
} from '../../services/images/onboardingImageCache';

const AGGRESSIVE_FEATURES: PaywallFeature[] = [
  {
    icon: 'waves',
    text: 'Fall asleep 40% faster with guided wind-downs',
  },
  {
    icon: 'heart',
    text: 'Lower resting heart rate in just 2 weeks',
  },
  {
    icon: 'moon',
    text: 'Wake up feeling rested instead of groggy',
  },
  {
    icon: 'sparkle',
    text: 'See your stress score improve day by day',
  },
  {
    icon: 'stat-health-spark',
    text: 'Track HRV gains that last beyond the session',
  },
  {
    icon: 'book',
    text: 'Build habits that stick with daily micro-lessons',
  },
];

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    text: '"I was skeptical but 2 weeks in and my sleep score improved by 40%. This app changed my life."',
    rating: 5,
  },
  {
    name: 'James R.',
    text: '"The breathing exercises alone are worth it. My stress levels dropped noticeably within days."',
    rating: 5,
  },
  {
    name: 'Priya K.',
    text: '"Finally something that actually works for anxiety. Not just another meditation app."',
    rating: 5,
  },
];

const AZO_WIDTH_SHARE = 0.45;
const AZO_MAX = 180;

export function NoTrialPaywallContent() {
  const { width: screenWidth } = useWindowDimensions();
  const azoSize = Math.min(AZO_MAX, Math.round(screenWidth * AZO_WIDTH_SHARE));

  return (
    <View style={styles.container}>
      {/* Azora mascot */}
      <View style={styles.mascotWrap}>
        <Image
          source={getOnboardingImageSource('azoGiftKoala')}
          style={{ width: azoSize, height: azoSize }}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={200}
          accessible={false}
        />
      </View>

      {/* Aggressive headline */}
      <View style={styles.headlineWrap}>
        <Text style={styles.title}>
          Unlock your full potential with{' '}
          <Text style={styles.titleBrand}>Azora Pro</Text>
        </Text>
        <Text style={styles.subtitle}>
          Join thousands who transformed their sleep, focus, and stress levels
        </Text>
        <View style={styles.priceComparison}>
          <Text style={styles.priceText}>Only $1.54/week</Text>
          <Text style={styles.priceDivider}>·</Text>
          <Text style={styles.priceText}>50x cheaper than therapy</Text>
        </View>
      </View>

      {/* Benefits list */}
      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>What you get:</Text>
        <PaywallFeatureList features={AGGRESSIVE_FEATURES} compact />
      </View>

      {/* Social proof */}
      <View style={styles.socialProofSection}>
        <Text style={styles.sectionTitle}>What users are saying:</Text>
        {TESTIMONIALS.map((testimonial) => (
          <View key={testimonial.name} style={styles.testimonialCard}>
            <View style={styles.testimonialHeader}>
              <View style={styles.stars}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <Icon key={index} name="star" size={16} color={colors.orange[500]} />
                ))}
              </View>
              <Text style={styles.testimonialName}>{testimonial.name}</Text>
            </View>
            <Text style={styles.testimonialText}>{testimonial.text}</Text>
          </View>
        ))}
      </View>

      {/* Trust signals */}
      <View style={styles.trustSection}>
        <View style={styles.trustRow}>
          <Icon name="check" size={18} color={colors.primary.blue500} />
          <Text style={styles.trustText}>Cancel anytime — no questions asked</Text>
        </View>
        <View style={styles.trustRow}>
          <Icon name="check" size={18} color={colors.primary.blue500} />
          <Text style={styles.trustText}>Money-back guarantee — love it or get a full refund</Text>
        </View>
        <View style={styles.trustRow}>
          <Icon name="check" size={18} color={colors.primary.blue500} />
          <Text style={styles.trustText}>Join 100,000+ users who sleep better and stress less</Text>
        </View>
      </View>

      {/* Emotional CTA */}
      <View style={styles.emotionalCta}>
        <Text style={styles.emotionalCtaText}>Your Journey to a Better You Starts Today.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  mascotWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  headlineWrap: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  title: {
    ...typography.title.title1,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: fonts.heavy,
    color: colors.text.primary,
    textAlign: 'center',
  },
  titleBrand: {
    color: colors.primary.blue500,
    fontFamily: fonts.heavy,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  benefitsSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    paddingHorizontal: spacing.xs,
  },
  socialProofSection: {
    gap: spacing.sm,
  },
  testimonialCard: {
    ...card.base,
    ...card.shadow,
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  testimonialName: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  testimonialText: {
    ...typography.body.medium,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  trustSection: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trustText: {
    ...typography.body.small,
    color: colors.text.secondary,
    flex: 1,
  },
  priceComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  priceText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  priceDivider: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
  emotionalCta: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  emotionalCtaText: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
