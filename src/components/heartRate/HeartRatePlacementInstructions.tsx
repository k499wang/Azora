import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Device from 'expo-device';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';
import { getHeartRatePlacementGuidance } from '../../lib/heartRate/captureGuidance';
import { Text } from '../common/Text';
import { HeartRatePlacementIllustration } from './HeartRatePlacementIllustration';
import { HeartRatePlacementStepsCard } from './HeartRatePlacementStepsCard';

interface HeartRatePlacementInstructionsProps {
  compact?: boolean;
  /** Rendered between the title and the illustration, e.g. the capture-mode toggle. */
  afterTitle?: ReactNode;
}

export function HeartRatePlacementInstructions({
  compact = false,
  afterTitle,
}: HeartRatePlacementInstructionsProps) {
  const placementGuidance = getHeartRatePlacementGuidance(
    Device.modelName,
    Device.modelId,
  );

  return (
    <View style={[styles.stack, compact && styles.stackCompact]}>
      <View style={styles.heading}>
        <Text style={[styles.headingTitle, compact && styles.headingTitleCompact]}>
          {placementGuidance.title}
        </Text>
      </View>

      {afterTitle}

      <HeartRatePlacementIllustration compact={compact} />

      <HeartRatePlacementStepsCard
        steps={placementGuidance.steps}
        appearance="plain"
        textSize={compact ? 'default' : 'large'}
      />
    </View>
  );
}

export default HeartRatePlacementInstructions;

const styles = StyleSheet.create({
  stack: {
    gap: spacing['2xl'],
  },
  stackCompact: {
    gap: spacing.lg,
  },
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
  headingTitleCompact: {
    fontSize: 24,
    lineHeight: 28,
  },
});
