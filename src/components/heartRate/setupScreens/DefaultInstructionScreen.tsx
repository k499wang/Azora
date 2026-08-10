import { Text } from '../../common/Text';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../theme/colors';
import { typography, fonts } from '../../../theme/typography';
import { spacing, padding } from '../../../theme/spacing';
import ChunkyButton from '../../common/ChunkyButton';
import { isShortScreen } from '../../../theme/breakpoints';

/** Slightly taller than the standard primary, matching this flow's footer. */
const CTA_MIN_HEIGHT = 52;
import type { SetupScreenProps } from '../../../lib/heartRate/types';
import {
  DEFAULT_CAPTURE_MODE,
  HEART_RATE_CAPTURE_MODES,
  isCaptureModeLocked,
  type HeartRateCaptureMode,
} from '../../../lib/heartRate/captureModes';
import { CaptureModeToggle } from '../CaptureModeToggle';
import type { RootStackNavigationProp } from '../../../app/navigation';
import { useFeatureAccess } from '../../../hooks/useFeatureAccess';
import { trackFeatureGateHit } from '../../../services/analytics/tracking';
import { FeatureKey } from '../../../services/subscriptions/featureAccess';
import { PaywallPlacement } from '../../../services/paywall';
import { getHeartRatePlacementGuidance } from '../../../lib/heartRate/captureGuidance';
import { getHeartRateCameraProfile } from '../../../lib/heartRate/cameraProfile';
import { HeartRatePlacementIllustration } from '../HeartRatePlacementIllustration';
import { HeartRatePlacementStepsCard } from '../HeartRatePlacementStepsCard';

export function DefaultInstructionScreen({ onNext, onCancel }: SetupScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp<'HeartRate'>>();
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const { isPro } = advancedStatsAccess;
  const [mode, setMode] = useState<HeartRateCaptureMode>(DEFAULT_CAPTURE_MODE);
  const placementGuidance = getHeartRatePlacementGuidance(
    Device.modelName,
    Device.modelId,
  );
  const showPlacementIllustration =
    getHeartRateCameraProfile(Device.modelName, Device.modelId).layout !== 'single';
  const { height: windowHeight } = useWindowDimensions();
  const compact = isShortScreen(windowHeight);

  const locked = isCaptureModeLocked(mode, isPro);

  const openPaywallForLockedMode = () => {
    trackFeatureGateHit({
      feature: FeatureKey.AdvancedStats,
      placement: PaywallPlacement.HeartRateProGate,
      sourceScreen: 'HeartRate',
      sourceAction: 'capture_mode_full',
      access: advancedStatsAccess,
    });
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.HeartRateProGate,
      sourceScreen: 'HeartRate',
      sourceAction: 'capture_mode_full',
      feature: FeatureKey.AdvancedStats,
    });
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.md },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onCancel}
        hitSlop={10}
        style={styles.cancelButton}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, compact && styles.titleCompact]}>
          {placementGuidance.title}
        </Text>

        <View style={styles.modeBlock}>
          <CaptureModeToggle value={mode} onChange={setMode} isPro={isPro} />
          <Text style={styles.modeCaption}>
            {HEART_RATE_CAPTURE_MODES[mode].shortDescription}
          </Text>
        </View>

        {showPlacementIllustration && (
          <View style={styles.illustration}>
            <HeartRatePlacementIllustration compact={compact} />
          </View>
        )}

        <View style={styles.stepsSection}>
          <Text style={styles.sectionLabel}>How to measure</Text>
          <HeartRatePlacementStepsCard
            steps={placementGuidance.steps}
            appearance="plain"
            textSize={compact ? 'default' : 'large'}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <ChunkyButton
          label={locked ? 'Unlock Full with Pro' : 'Begin measurement'}
          shape="card"
          minHeight={CTA_MIN_HEIGHT}
          haptic="tap"
          onPress={() => {
            if (locked) {
              openPaywallForLockedMode();
            } else {
              onNext({ mode });
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: padding.screen.horizontal,
    backgroundColor: colors.background.primary,
  },
  cancelButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  cancelText: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue600,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'left',
  },
  titleCompact: {
    ...typography.title.title2,
  },
  modeBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  modeCaption: {
    ...typography.label.medium,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  illustration: {
    marginTop: spacing.lg,
  },
  stepsSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label.detail,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  footer: {
    paddingTop: spacing.sm,
  },
});
