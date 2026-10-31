import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { COMMUNITY_SIZE } from '../../../data/socialProof';
import { useAppStoreRatingQuery } from '../../../queries/reviews/useAppStoreRatingQuery';
import { COMMUNITY_REVIEWS, type PaywallTestimonial } from '../../../data/paywallTestimonials';
import { spacing } from '../../../theme/spacing';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import RatingTrophy from '../RatingTrophy';
import ReviewCardRow from '../ReviewCardRow';
import { scaleVisual } from '../onboardingVisualScale';

interface CommunityProofScreenProps {
  title?: string;
  reviews?: readonly PaywallTestimonial[];
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const TROPHY_MAX_SIZE = scaleVisual(360);
const TROPHY_AT = 150;

export default function CommunityProofScreen({
  title = `Join ${COMMUNITY_SIZE}+ people getting their life back on track`,
  reviews = COMMUNITY_REVIEWS,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: CommunityProofScreenProps) {
  const { width: windowWidth } = useWindowDimensions();
  const trophySize = Math.min(windowWidth - spacing.lg * 2, TROPHY_MAX_SIZE);
  const { data: liveRating } = useAppStoreRatingQuery();
  // Fixed at mount so an answer that lands mid-screen never drops the trophy in late.
  const [rating] = useState(liveRating);

  return (
    <OnboardingScreenLayout
      title={title}
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        {rating != null ? (
          <View style={styles.rating}>
            <RatingTrophy
              value={rating}
              label="App Store rating"
              size={trophySize}
              enterAt={TROPHY_AT}
            />
          </View>
        ) : null}

        <ReviewCardRow reviews={reviews} />
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
});
