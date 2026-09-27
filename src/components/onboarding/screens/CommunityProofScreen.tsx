import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { APP_STORE_RATING, COMMUNITY_SIZE } from '../../../data/socialProof';
import { COMMUNITY_REVIEWS } from '../../../data/paywallTestimonials';
import { spacing } from '../../../theme/spacing';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import RatingWreath from '../RatingWreath';
import ReviewCard from '../ReviewCard';
import { scaleVisual } from '../onboardingVisualScale';

interface CommunityProofScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const WREATH_SIZE = scaleVisual(280);
/** how much of the next card shows past the edge, so the row reads as swipeable */
const PEEK = spacing['4xl'];

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
          {COMMUNITY_REVIEWS.map((review) => (
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
    gap: spacing.xl,
  },
  rating: {
    alignItems: 'center',
    marginTop: -spacing.lg,
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
});
