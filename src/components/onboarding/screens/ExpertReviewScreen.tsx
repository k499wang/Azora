import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { EXPERT_REVIEWS, type ExpertReview } from '../../../data/socialProof';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { Text } from '../../common/Text';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface ExpertReviewScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const AVATAR_SIZE = 48;

export default function ExpertReviewScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: ExpertReviewScreenProps) {
  return (
    <OnboardingScreenLayout
      title="Our plans are designed in collaboration with licensed therapists"
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        {EXPERT_REVIEWS.map((review, index) => (
          <ExpertCard key={index} review={review} />
        ))}
      </View>
    </OnboardingScreenLayout>
  );
}

interface ExpertCardProps {
  review: ExpertReview;
}

function ExpertCard({ review }: ExpertCardProps) {
  return (
    <View style={styles.expertCard}>
      <Text style={styles.cardTitle}>{review.cardTitle}</Text>
      <View style={styles.expert}>
        <Image
          source={getOnboardingImageSource(review.avatar)}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
          accessible={false}
        />
        <View style={styles.expertText}>
          <Text style={styles.name}>{review.name}</Text>
          <Text style={styles.position}>{review.position}</Text>
        </View>
      </View>
      <Text style={styles.quote}>{review.quote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  expertCard: {
    ...card.base,
    ...card.shadow,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
  expert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.neutral[100],
  },
  expertText: {
    flex: 1,
  },
  name: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  position: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  quote: {
    ...typography.body.medium,
    color: colors.text.primary,
  },
});
