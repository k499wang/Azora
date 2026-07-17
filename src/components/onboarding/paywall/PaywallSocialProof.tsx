import { Text } from '../../common/Text';
import { View } from 'react-native';
import { colors } from '../../../theme/colors';
import Icon from '../../common/icons/Icon';
import { paywallStepStyles as styles } from './paywallStepStyles';

export const APP_STORE_RATING = '4.8';

// Sample quotes — replace with the real Sunny W / Melody Z App Store reviews before release.
export const sampleReviews: Array<{ name: string; title: string; quote: string }> = [
  {
    name: 'Sunny W.',
    title: 'My husband noticed first',
    quote:
      'I was skeptical at first. But my mind actually quiets down by the third minute, and my husband noticed the change before I said a word.',
  },
  {
    name: 'Melody Z.',
    title: 'Best sleep in 3 years',
    quote:
      'I had not slept a full night in three years. Three weeks into using Azora, I am finally waking up rested instead of exhausted.',
  },
  {
    name: 'Jordan P.',
    title: 'Fits into a busy day',
    quote:
      'I do not have time for a long routine. This only takes a few minutes, right between dropping the kids off and my first meeting.',
  },
];

export function Stars({ size }: { size: number }) {
  return (
    <View style={styles.socialProofStars}>
      {Array.from({ length: 5 }, (_, index) => (
        <Icon key={index} name="star" size={size} color={colors.orange[500]} />
      ))}
    </View>
  );
}

export function PaywallSocialProof() {
  return (
    <View style={styles.socialProof}>
      <View style={styles.socialProofRatingRow}>
        <Stars size={24} />
        <Text style={styles.socialProofRatingText}>
          {APP_STORE_RATING} on the App Store
        </Text>
      </View>
      {sampleReviews.map((review) => (
        <View key={review.name} style={styles.socialProofCard}>
          <View style={styles.socialProofCardRatingRow}>
            <Stars size={20} />
            <Text style={styles.socialProofCardRating}>5.0</Text>
          </View>
          <Text style={styles.socialProofCardTitle}>{review.title}</Text>
          <Text style={styles.socialProofQuote}>“{review.quote}”</Text>
          <Text style={styles.socialProofName}>{review.name}</Text>
        </View>
      ))}
    </View>
  );
}

export default PaywallSocialProof;
