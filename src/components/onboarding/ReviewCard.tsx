import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { PaywallTestimonial } from '../../data/paywallTestimonials';
import { getOnboardingImageSource } from '../../services/images/onboardingImageCache';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';

interface ReviewCardProps {
  review: PaywallTestimonial;
  /** Fixed width for a card in a swiping row; omitted, it fills its parent. */
  width?: number;
  /** Leads the quote with the review's own headline. */
  showTitle?: boolean;
}

const STAR_COUNT = 5;
const STAR_SIZE = 20;
const AVATAR_SIZE = 36;

/** A member review: who wrote it, five stars, and what they said. */
export default function ReviewCard({ review, width, showTitle = false }: ReviewCardProps) {
  return (
    <View style={[styles.review, width != null && { width }]}>
      <View style={styles.header}>
        <View style={styles.reviewer}>
          <Image
            source={getOnboardingImageSource(review.avatar)}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
            accessible={false}
          />
          <Text style={styles.author} numberOfLines={1}>
            {review.author}
          </Text>
        </View>
        <View style={styles.stars}>
          {Array.from({ length: STAR_COUNT }, (_, i) => (
            <Icon key={i} name="star" size={STAR_SIZE} color={colors.yellow[400]} />
          ))}
        </View>
      </View>
      {showTitle ? <Text style={styles.title}>{review.title}</Text> : null}
      <Text style={styles.quote}>{review.quote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  review: {
    ...card.base,
    ...card.shadow,
    padding: spacing.md,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  reviewer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  author: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flexShrink: 1,
  },
  stars: {
    flexDirection: 'row',
  },
  title: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  quote: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
