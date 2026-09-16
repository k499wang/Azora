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
import {
  getOnboardingImageSource,
  type OnboardingImageKey,
} from '../../services/images/onboardingImageCache';
import {
  getHeartRateCameraProfile,
  type HeartRateCameraLayout,
} from '../../lib/heartRate/cameraProfile';

interface HeartRatePlacementIllustrationProps {
  compact?: boolean;
  palette?: HeartRatePlacementPalette;
  /**
   * Side of the square photo, for a caller that has already measured its own
   * slot. Omitted, the photo takes the width it is given.
   */
  size?: number;
}

/** One photo per body shape: one lens, two lenses, three lenses. */
const ILLUSTRATION_BY_LAYOUT: Record<
  Exclude<HeartRateCameraLayout, 'unknown'>,
  OnboardingImageKey
> = {
  single: 'cameraPlacementSingle',
  dual: 'cameraPlacementDual',
  triple: 'cameraPlacementTriple',
};

export function HeartRatePlacementIllustration({
  compact = false,
  palette = LIGHT_HEART_RATE_HELP_PALETTE,
  size,
}: HeartRatePlacementIllustrationProps) {
  const cameraProfile = getHeartRateCameraProfile(Device.modelName, Device.modelId);

  // Nothing to point at: the device is not one we have art for, so the written
  // instruction carries the step on its own.
  if (cameraProfile.layout === 'unknown') {
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
      source={getOnboardingImageSource(ILLUSTRATION_BY_LAYOUT[cameraProfile.layout])}
      style={[
        styles.illustration,
        size == null ? null : { width: size, height: size },
      ]}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={0}
      accessibilityLabel={`The highlighted ${cameraProfile.target}, followed by the soft pad of an index finger covering that lens completely. The flash stays uncovered.`}
    />
  );
}

const styles = StyleSheet.create({
  illustration: {
    width: '100%',
    // The art is a square photo of the phone's back, so it is drawn square: a
    // wide frame would shrink it to the height of the box and leave gaps.
    aspectRatio: 1,
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
