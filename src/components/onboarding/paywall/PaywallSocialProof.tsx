import { Text } from '../../common/Text';
import { View } from 'react-native';
import { colors } from '../../../theme/colors';
import Icon from '../../common/icons/Icon';
import { paywallStepStyles as styles } from './paywallStepStyles';

export const APP_STORE_RATING = '5.0';

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
    </View>
  );
}

export default PaywallSocialProof;
