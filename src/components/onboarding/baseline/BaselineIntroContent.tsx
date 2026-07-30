import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as Device from 'expo-device';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import {
  getHeartRateCameraTarget,
  getHeartRatePlacementGuidance,
} from '../../../lib/heartRate/captureGuidance';

interface BaselineIntroContentProps {
  sessionSec: number;
}

export function BaselineIntroContent({ sessionSec }: BaselineIntroContentProps) {
  const cameraTarget = getHeartRateCameraTarget(Device.modelName);
  const cameraIllustration = cameraTarget === 'camera all the way to the right'
    ? 'cameraPpgTriple'
    : 'cameraPpg';
  const placementGuidance = getHeartRatePlacementGuidance(Device.modelName);

  return (
    <>
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>
          {placementGuidance.title}
        </Text>
        <Text style={styles.headingSubtitle}>
          {placementGuidance.instruction}
        </Text>
        <Text style={styles.warningText}>
          {placementGuidance.multiCameraWarning}
        </Text>
        <Text style={styles.durationText}>
          Hold still for {sessionSec} seconds after your pulse is found.
        </Text>
      </View>

      <View style={styles.illustrationWrap}>
        <Image
          source={getOnboardingImageSource(cameraIllustration)}
          style={styles.illustration}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
          accessibilityLabel={`Correct and incorrect ways to completely cover the ${cameraTarget} with your fingertip`}
        />
      </View>
    </>
  );
}

export default BaselineIntroContent;

const styles = StyleSheet.create({
  heading: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  headingTitle: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: colors.text.primary,
  },
  headingSubtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  warningText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  durationText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -spacing.lg,
  },
  illustration: {
    width: '100%',
    height: 200,
  },
});
