import { Text } from '../../common/Text';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography, fonts } from '../../../theme/typography';
import { spacing, padding } from '../../../theme/spacing';
import ChunkyButton from '../../common/ChunkyButton';
import GlassIconButton from '../../common/GlassIconButton';
import { SESSION_GLASS_BUTTON_SIZE } from '../../../features/exercise/shared/components/SessionGlassButton';
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Matches the floating close on the result screens: absolute, above
          everything, with the scroll content clearing below it. */}
      <GlassIconButton
        accessibilityLabel="Close"
        size={SESSION_GLASS_BUTTON_SIZE}
        style={[
          styles.floatingAction,
          styles.floatingClose,
          { top: insets.top + padding.screen.vertical },
        ]}
        onPress={onCancel}
      >
        <MaterialCommunityIcons name="close" size={20} color={colors.text.secondary} />
      </GlassIconButton>

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
          <HeartRatePlacementStepsCard
            steps={placementGuidance.steps}
            appearance="card"
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
    backgroundColor: colors.background.canvas,
  },
  floatingAction: {
    position: 'absolute',
    zIndex: 2,
  },
  floatingClose: {
    left: padding.screen.horizontal,
  },
  scrollContent: {
    paddingTop: padding.screen.vertical + SESSION_GLASS_BUTTON_SIZE,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
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
  },
  footer: {
    paddingTop: spacing.sm,
  },
});
