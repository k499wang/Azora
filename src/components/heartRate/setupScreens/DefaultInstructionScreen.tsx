import { Image as RNImage, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { card } from '../../../theme/card';
import type { SetupScreenProps } from '../../../lib/heartRate/types';
import {
  HEART_RATE_CAPTURE_MODES,
  DEFAULT_CAPTURE_MODE,
  type HeartRateCaptureMode,
} from '../../../lib/heartRate/captureModes';
import { CaptureModeToggle } from '../CaptureModeToggle';
import type { RootStackNavigationProp } from '../../../app/navigation';
import { useFeatureAccess } from '../../../hooks/useFeatureAccess';
import { FeatureKey } from '../../../services/subscriptions/featureAccess';
import { PaywallPlacement } from '../../../services/paywall';

const INSTRUCTION_IMAGE = require('../../../../assets/onboarding/camerappg.png');

const STEPS = [
  'Cover the rear camera with the fleshy pad of your finger, not your nail',
  'Keep your phone and finger still',
  'Use gentle pressure and breathe normally',
];

export function DefaultInstructionScreen({ onNext }: SetupScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp<'HeartRate'>>();
  const { isPro } = useFeatureAccess(FeatureKey.AdvancedStats);
  const [mode, setMode] = useState<HeartRateCaptureMode>(DEFAULT_CAPTURE_MODE);
  const durationSeconds = Math.round(HEART_RATE_CAPTURE_MODES[mode].durationMs / 1000);

  const openPaywallForLockedMode = () => {
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.HeartRateProGate,
      sourceScreen: 'HeartRate',
      sourceAction: 'capture_mode_full',
      feature: FeatureKey.AdvancedStats,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 56 }]}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="heart-pulse" size={20} color={colors.error[500]} />
        <Text style={styles.title}>Measure Heart Rate</Text>
      </View>
      <View style={styles.intro}>
        <MaterialCommunityIcons
          name="information-outline"
          size={16}
          color={colors.primary.blue600}
        />
        <Text style={styles.introText}>
          Your phone's camera detects your pulse through the light passing through your fingertip.
        </Text>
      </View>

      <View style={styles.visualFrame}>
        <InstructionImage />
      </View>

      <View style={[card.base, card.shadow, styles.stepsCard]}>
        {STEPS.map((text, i) => (
          <View key={i} style={[styles.stepRow, i === 0 && styles.stepRowFirst]}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="timer-outline" size={12} color={colors.text.tertiary} />
          <Text style={styles.metaText}>~{durationSeconds}s</Text>
        </View>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="lock-outline" size={12} color={colors.text.tertiary} />
          <Text style={styles.metaText}>On-device</Text>
        </View>
      </View>

      <View style={styles.spacer} />

      <View style={styles.modeToggle}>
        <CaptureModeToggle
          value={mode}
          onChange={setMode}
          isPro={isPro}
          onLockedPress={openPaywallForLockedMode}
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        onPress={() => onNext({ mode })}
      >
        <Text style={styles.primaryButtonText}>Begin</Text>
      </Pressable>
    </View>
  );
}

function InstructionImage() {
  const { width: screenWidth } = useWindowDimensions();
  const resolved = useMemo(() => RNImage.resolveAssetSource(INSTRUCTION_IMAGE), []);

  const aspect = resolved.height / resolved.width;
  const frameWidth = screenWidth - spacing.lg * 2;
  const frameHeight = frameWidth * aspect;

  return (
    <Image
      source={INSTRUCTION_IMAGE}
      style={{ width: frameWidth, height: frameHeight }}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={0}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    backgroundColor: colors.background.accentSoft,
    borderRadius: 12,
  },
  introText: {
    ...typography.body.small,
    color: colors.text.secondary,
    flex: 1,
  },
  visualFrame: {
    width: '100%',
    marginBottom: spacing.lg,
    borderRadius: 18,
    overflow: 'hidden',
  },
  stepsCard: {
    padding: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  stepRowFirst: {
    paddingTop: 0,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...typography.label.medium,
    color: colors.primary.blue700,
    fontWeight: '700',
  },
  stepText: {
    ...typography.body.medium,
    color: colors.text.primary,
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  metaText: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
  },
  modeToggle: {
    marginBottom: spacing.md,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue600,
    borderRadius: 16,
    paddingVertical: spacing.md,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    ...typography.button.large,
    color: colors.text.inverse,
  },
});
