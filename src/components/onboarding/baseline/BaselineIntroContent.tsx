import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as Device from 'expo-device';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import { getHeartRatePlacementGuidance } from '../../../lib/heartRate/captureGuidance';
import { getHeartRateCameraProfile } from '../../../lib/heartRate/cameraProfile';
import { HeartRatePlacementStepsCard } from '../../heartRate/HeartRatePlacementStepsCard';

export function BaselineIntroContent() {
  const cameraProfile = getHeartRateCameraProfile(Device.modelName);
  const placementGuidance = getHeartRatePlacementGuidance(Device.modelName);
  const cameraIllustration = cameraProfile.layout === 'triple'
    ? 'cameraPlacementTriple'
    : cameraProfile.layout === 'dual'
      ? 'cameraPlacementDual'
      : null;

  return (
    <>
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>
          {placementGuidance.title}
        </Text>
        <Text style={styles.headingSubtitle}>
          {placementGuidance.instruction}
        </Text>
      </View>

      {cameraIllustration != null ? (
        <Image
          source={getOnboardingImageSource(cameraIllustration)}
          style={styles.illustration}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
          accessibilityLabel={`The highlighted ${cameraProfile.target}, followed by the soft pad of an index finger covering that lens completely. The flash stays uncovered.`}
        />
      ) : (
        <View style={styles.genericGuide}>
          <View style={styles.genericIcon}>
            <Icon name="camera" size={22} color={colors.primary.blue700} />
          </View>
          <Text style={styles.genericText}>
            The live camera check will show you which lens to cover.
          </Text>
        </View>
      )}

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
  headingSubtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 360,
  },
  illustration: {
    width: '112%',
    aspectRatio: 1.82,
    alignSelf: 'center',
  },
  genericGuide: {
    minHeight: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  genericIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genericText: {
    ...typography.body.small,
    color: colors.text.secondary,
    flexShrink: 1,
  },
});
