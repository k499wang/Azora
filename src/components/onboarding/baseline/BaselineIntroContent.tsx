import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import * as Device from 'expo-device';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts } from '../../../theme/typography';
import { getHeartRatePlacementGuidance } from '../../../lib/heartRate/captureGuidance';
import { HeartRatePlacementIllustration } from '../../heartRate/HeartRatePlacementIllustration';
import { HeartRatePlacementStepsCard } from '../../heartRate/HeartRatePlacementStepsCard';

export function BaselineIntroContent() {
  const placementGuidance = getHeartRatePlacementGuidance(
    Device.modelName,
    Device.modelId,
  );

  return (
    <>
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>{placementGuidance.title}</Text>
      </View>

      <HeartRatePlacementIllustration />

      <HeartRatePlacementStepsCard
        steps={placementGuidance.steps}
        appearance="plain"
        textSize="large"
      />
    </>
  );
}

export default BaselineIntroContent;

const styles = StyleSheet.create({
  heading: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  headingTitle: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
