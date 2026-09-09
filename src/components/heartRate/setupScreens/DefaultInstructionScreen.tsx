import { Text } from '../../common/Text';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
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
import { isShortScreen } from '../../../theme/breakpoints';
import Icon from '../../common/icons/Icon';
import { triggerTapHaptic } from '../../../native/tapHaptics';

/** Slightly taller than the standard primary, matching this flow's footer. */
const CTA_MIN_HEIGHT = 52;
const BACK_ICON_SIZE = 26;
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
import { HeartRatePlacementInstructions } from '../HeartRatePlacementInstructions';

export function DefaultInstructionScreen({ onNext, onCancel }: SetupScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp<'HeartRate'>>();
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const { isPro } = advancedStatsAccess;
  const [mode, setMode] = useState<HeartRateCaptureMode>(DEFAULT_CAPTURE_MODE);
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Scrolls with the page rather than floating over it, so nothing sits
            on top of the illustration once the steps are scrolled up. */}
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
          <HeartRatePlacementInstructions
            compact={compact}
            afterTitle={
              <View style={styles.modeBlock}>
                <CaptureModeToggle value={mode} onChange={setMode} isPro={isPro} />
                <Text style={styles.modeCaption}>
                  {HEART_RATE_CAPTURE_MODES[mode].shortDescription}
                </Text>
              </View>
            }
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
  },
  modeBlock: {
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
  footer: {
    paddingTop: spacing.sm,
  },
});
