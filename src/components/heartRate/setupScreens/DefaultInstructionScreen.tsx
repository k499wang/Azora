import { Text } from '../../common/Text';
import { useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../theme/colors';
import { typography, fonts } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
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
import { HeartRatePlacementStepsCard } from '../HeartRatePlacementStepsCard';

export function DefaultInstructionScreen({ onNext }: SetupScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp<'HeartRate'>>();
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const { isPro } = advancedStatsAccess;
  const [mode, setMode] = useState<HeartRateCaptureMode>(DEFAULT_CAPTURE_MODE);
  const placementGuidance = getHeartRatePlacementGuidance(Device.modelName);

  const pressScale = useRef(new Animated.Value(1)).current;

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
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{placementGuidance.title}</Text>
        <Text style={styles.subtitle}>
          {placementGuidance.instruction}
        </Text>
        <Text style={styles.cameraWarning}>
          {placementGuidance.multiCameraWarning}
        </Text>

        <View style={styles.modeBlock}>
          <CaptureModeToggle value={mode} onChange={setMode} isPro={isPro} />
          <View style={styles.perkRow}>
            {HEART_RATE_CAPTURE_MODES[mode].perks.map((perk) => (
              <View key={perk} style={styles.perkChip}>
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.stepsCard}>
          <HeartRatePlacementStepsCard steps={placementGuidance.steps} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => (locked ? openPaywallForLockedMode() : onNext({ mode }))}
          onPressIn={() =>
            Animated.spring(pressScale, {
              toValue: 0.97,
              useNativeDriver: true,
              speed: 40,
              bounciness: 0,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(pressScale, {
              toValue: 1,
              useNativeDriver: true,
              speed: 40,
              bounciness: 6,
            }).start()
          }
        >
          <Animated.View style={[styles.ctaShadow, { transform: [{ scale: pressScale }] }]}>
            <LinearGradient
              colors={[colors.primary.blue500, colors.primary.blue700]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cta}
            >
              <MaterialCommunityIcons
                name={locked ? 'lock-open-outline' : 'heart-pulse'}
                size={18}
                color={colors.text.inverse}
              />
              <Text style={styles.ctaText}>
                {locked ? 'Unlock Full with Pro' : 'Begin measurement'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cameraWarning: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  modeBlock: {
    marginTop: spacing.xl,
  },
  perkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    minHeight: 60,
  },
  perkChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.background.secondary,
  },
  perkText: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  stepsCard: {
    marginTop: spacing.xl,
  },
  footer: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  ctaShadow: {
    borderRadius: 16,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 6,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaText: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.inverse,
  },
});
