import { Image } from 'expo-image';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { APP_STORE_RATING, COMMUNITY_SIZE } from '../../../data/socialProof';
import {
  PAYWALL_TESTIMONIALS,
  type PaywallTestimonial,
} from '../../../data/paywallTestimonials';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import Icon from '../../common/icons/Icon';
import { Text } from '../../common/Text';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import RatingWreath from '../RatingWreath';
import { scaleVisual } from '../onboardingVisualScale';

interface CommunityProofScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const STAR_COUNT = 5;
const AVATAR_SIZE = 28;
const WREATH_SIZE = scaleVisual(300);
/** how much of the next card shows past the edge, so the row reads as swipeable */
const PEEK = spacing['2xl'];

function Stars({ size }: { size: number }) {
  return (
    <View style={styles.stars}>
      {Array.from({ length: STAR_COUNT }, (_, i) => (
        <Icon key={i} name="star" size={size} color={colors.yellow[400]} />
      ))}
    </View>
  );
}

function ReviewCard({ review, width }: { review: PaywallTestimonial; width: number }) {
  return (
    <View style={[styles.review, { width }]}>
      <View style={styles.reviewHeader}>
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
        <Stars size={18} />
      </View>
      <Text style={styles.reviewTitle}>{review.title}</Text>
      <Text style={styles.reviewText}>{review.quote}</Text>
    </View>
  );
}

export default function CommunityProofScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: CommunityProofScreenProps) {
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = windowWidth - spacing.lg * 2 - PEEK;

  return (
    <OnboardingScreenLayout
      title={`Join ${COMMUNITY_SIZE}+ people getting their life back on track`}
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <View style={styles.rating}>
          <RatingWreath
            value={APP_STORE_RATING}
            label="App Store Rating"
            caption={String(new Date().getFullYear())}
            size={WREATH_SIZE}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + spacing.md}
          decelerationRate="fast"
          contentContainerStyle={styles.reviews}
          style={styles.reviewScroller}
        >
          {PAYWALL_TESTIMONIALS.map((review) => (
            <ReviewCard key={review.author} review={review} width={cardWidth} />
          ))}
        </ScrollView>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing['2xl'],
    paddingBottom: spacing.xl,
  },
  rating: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewScroller: {
    marginHorizontal: -spacing.lg,
    flexGrow: 0,
  },
  reviews: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  review: {
    ...card.base,
    ...card.shadow,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  reviewHeader: {
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
  reviewTitle: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  reviewText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
