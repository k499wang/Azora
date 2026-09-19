import { Text } from '../../common/Text';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../theme/colors';
import { pressable } from '../../../theme/pressable';
import { typography, fonts } from '../../../theme/typography';
import { spacing, padding } from '../../../theme/spacing';
import ChunkyButton from '../../common/ChunkyButton';
import Icon from '../../common/icons/Icon';
import { triggerTapHaptic } from '../../../native/tapHaptics';
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
import { HeartRateInstructionCarousel } from '../HeartRateInstructionCarousel';

const CTA_MIN_HEIGHT = 52;
const BACK_ICON_SIZE = 26;

const INSTRUCTION_STEPS = [
  {
    title: 'Warm your hands',
    detail:
      'Rub your hands together for about 30 seconds. If your case overlaps the camera or flash, remove it.',
    visual: { kind: 'image' as const, key: 'heartRateWarmHands' as const },
  },
  {
    title: 'Cover the camera lens',
    detail:
      'Place the soft pad of your index finger flat over the highlighted lens. Keep the flash uncovered.',
    visual: { kind: 'lensPlacement' as const },
  },
  {
    title: 'Hold lightly and stay still',
    detail:
      'Rest your elbows on a table or your knees. Keep gentle contact, breathe normally, and don\'t talk or adjust your grip.',
    visual: { kind: 'image' as const, key: 'heartRateHoldStill' as const },
  },
];

export function DefaultInstructionScreen({ onNext, onCancel }: SetupScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp<'HeartRate'>>();
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const { isPro } = advancedStatsAccess;
  const [mode, setMode] = useState<HeartRateCaptureMode>(DEFAULT_CAPTURE_MODE);
  const [stepIndex, setStepIndex] = useState(0);

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={spacing.md}
          style={({ pressed }) => [
            styles.back,
            pressed && styles.backPressed,
          ]}
          onPress={() => {
            triggerTapHaptic();
            onCancel();
          }}
        >
          <Icon
            name="chevron-left"
            size={BACK_ICON_SIZE}
            color={colors.text.primary}
          />
        </Pressable>

        <View style={styles.instructions}>
          <View style={styles.modeBlock}>
            <CaptureModeToggle value={mode} onChange={setMode} isPro={isPro} />
            <Text style={styles.modeCaption}>
              {HEART_RATE_CAPTURE_MODES[mode].shortDescription}
            </Text>
          </View>

          <HeartRateInstructionCarousel
            steps={INSTRUCTION_STEPS}
            index={stepIndex}
            onIndexChange={setStepIndex}
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
  back: {
    marginLeft: -spacing.xs,
    marginRight: spacing.xs,
  },
  backPressed: pressable.control,
  scrollContent: {
    paddingTop: padding.screen.vertical,
    paddingBottom: spacing.lg,
  },
  instructions: {
    marginTop: spacing.xs,
    gap: spacing.lg,
  },
  modeBlock: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  modeCaption: {
    ...typography.label.medium,
    fontFamily: fonts.medium,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  footer: {
    paddingTop: spacing.sm,
  },
});
