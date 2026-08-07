import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as Device from 'expo-device';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';
import {
  LIGHT_HEART_RATE_HELP_PALETTE,
  type HeartRatePlacementPalette,
} from '../../theme/heartRateHelpPalette';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getOnboardingImageSource } from '../../services/images/onboardingImageCache';
import { getHeartRateCameraProfile } from '../../lib/heartRate/cameraProfile';

interface HeartRatePlacementIllustrationProps {
  compact?: boolean;
  palette?: HeartRatePlacementPalette;
}

export function HeartRatePlacementIllustration({
  compact = false,
  palette = LIGHT_HEART_RATE_HELP_PALETTE,
}: HeartRatePlacementIllustrationProps) {
  const cameraProfile = getHeartRateCameraProfile(Device.modelName, Device.modelId);
  const cameraIllustration = cameraProfile.layout === 'triple'
    ? 'cameraPlacementTriple'
    : cameraProfile.layout === 'dual'
      ? 'cameraPlacementDual'
      : null;

  if (cameraProfile.layout === 'single') return null;

  if (cameraIllustration == null) {
    return (
      <View style={[styles.genericGuide, compact && styles.genericGuideCompact]}>
        <View
          style={[styles.genericIcon, { backgroundColor: palette.markerSurface }]}
        >
          <Icon name="camera" size={22} color={palette.markerText} />
        </View>
        <Text style={[styles.genericText, { color: palette.detail }]}>
          The live camera check will show you which lens to cover.
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={getOnboardingImageSource(cameraIllustration)}
      style={styles.illustration}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={0}
      accessibilityLabel={`The highlighted ${cameraProfile.target}, followed by the soft pad of an index finger covering that lens completely. The flash stays uncovered.`}
    />
  );
}

const styles = StyleSheet.create({
  illustration: {
    width: '92%',
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
  genericGuideCompact: {
    minHeight: 120,
  },
  genericIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genericText: {
    ...typography.body.small,
    flexShrink: 1,
  },
});
