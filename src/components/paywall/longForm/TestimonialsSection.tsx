import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import LaurelStat from '../../common/LaurelStat';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { card } from '../../../theme/card';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import { PAYWALL_TESTIMONIALS } from '../../../data/paywallTestimonials';
import { PaywallSection } from './PaywallSection';
import { FutureLetterCard } from './FutureLetterCard';

const CARD_WIDTH = 300;
const AVATAR = 40;
const STARS = 5;
const STAR_SIZE = 24;
const LAUREL_SIZE = 64;
const RATING_VALUE = 'Top rated';
const RATING_LABEL = 'on the App Store';

interface TestimonialsSectionProps {
  name?: string | null;
}

export function TestimonialsSection({ name }: TestimonialsSectionProps) {
  return (
    <PaywallSection title="Join a community of 100,000+ happy users">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.sm}
        snapToAlignment="start"
        contentContainerStyle={styles.row}
      >
        {PAYWALL_TESTIMONIALS.map((testimonial) => (
          <View key={testimonial.author} style={styles.card}>
            <View style={styles.stars}>
              {Array.from({ length: STARS }, (_, index) => (
                <Icon
                  key={index}
                  name="star"
                  size={STAR_SIZE}
                  color={colors.yellow[400]}
                />
              ))}
              <Text style={styles.rating}>5.0</Text>
            </View>
            <Text style={styles.title}>{testimonial.title}</Text>
            <Text style={styles.quote}>{testimonial.quote}</Text>
            <View style={styles.author}>
              <Image
                source={getOnboardingImageSource(testimonial.avatar)}
                style={styles.avatar}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
                accessible={false}
              />
              <Text style={styles.authorName}>{testimonial.author}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <FutureLetterCard name={name} />

      <View style={styles.statsRow}>
        <LaurelStat
          scale="sm"
          size={LAUREL_SIZE}
          value={RATING_VALUE}
          label={RATING_LABEL}
        />
        <LaurelStat
          scale="sm"
          size={LAUREL_SIZE}
          value="100K+"
          label="users worldwide"
        />
      </View>
    </PaywallSection>
  );
}

const styles = StyleSheet.create({
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    marginLeft: 4,
  },
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.lg,
  },
  card: {
    ...card.base,
    ...card.shadow,
    width: CARD_WIDTH,
    backgroundColor: colors.background.card,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 180,
  },
  title: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  quote: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  authorName: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  statsRow: {
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
});
