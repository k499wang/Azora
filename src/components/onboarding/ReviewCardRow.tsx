import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import type { PaywallTestimonial } from '../../data/paywallTestimonials';
import { spacing } from '../../theme/spacing';
import ReviewCard from './ReviewCard';

/** how much of the next card shows past the edge, so the row reads as swipeable */
const PEEK = spacing['4xl'];

interface ReviewCardRowProps {
  reviews: readonly PaywallTestimonial[];
}

/** Review cards in a swiping row, bleeding into a `spacing.lg` screen gutter. */
export default function ReviewCardRow({ reviews }: ReviewCardRowProps) {
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = windowWidth - spacing.lg * 2 - PEEK;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + spacing.md}
      decelerationRate="fast"
      contentContainerStyle={styles.reviews}
      style={styles.reviewScroller}
    >
      {reviews.map((review) => (
        <ReviewCard key={review.quote} review={review} width={cardWidth} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // The scroller clips at its bounds, so the cards get room for their shadow
  // and the negative margin keeps the row where it was.
  reviewScroller: {
    marginHorizontal: -spacing.lg,
    marginVertical: -spacing.md,
    flexGrow: 0,
  },
  reviews: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
});
