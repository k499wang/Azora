import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

const BRAIN_SCANS = require('../../../../assets/onboarding/brain-scan-comparison.webp');
const BRAIN_SCAN_ASPECT_RATIO = 3 / 2;
const BRAIN_SCAN_CONTENT_OFFSET = -10;
const RIGHT_BRAIN_LABEL_OFFSET = 12;

interface BrainScienceScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function BrainScienceScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: BrainScienceScreenProps) {
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    Animated.timing(reveal, {
      toValue: 1,
      duration: 560,
      delay: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reveal]);

  return (
    <OnboardingScreenLayout
      title="Breathing is a neuroscience."
      subtitle="Azora uses proven breathing science to reset your nervous system in seconds."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <Animated.View
        style={[
          styles.visual,
          {
            opacity: reveal,
            transform: [
              {
                translateY: reveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.scanFrame}>
          <Image
            source={BRAIN_SCANS}
            style={styles.scans}
            resizeMode="cover"
          />
        </View>

        <View style={styles.pillRow}>
          <View style={[styles.pillCol, styles.pillColBefore]}>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>Before Azora</Text>
            </View>
          </View>
          <View style={[styles.pillCol, styles.pillColAfter]}>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>After Azora</Text>
            </View>
          </View>
        </View>

        <Text style={styles.legend}>
          Red shows a stressed brain. After 10 minutes of guided Azora
          breathwork, blue reflects a calmer nervous system and steadier focus.
        </Text>
      </Animated.View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  visual: {
    width: '100%',
    alignItems: 'center',
  },
  scanFrame: {
    width: '100%',
    alignSelf: 'center',
    aspectRatio: BRAIN_SCAN_ASPECT_RATIO,
    borderRadius: 20,
    overflow: 'hidden',
  },
  scans: {
    width: '106%',
    height: '100%',
    alignSelf: 'center',
    transform: [{ translateX: BRAIN_SCAN_CONTENT_OFFSET }],
  },
  pillRow: {
    width: '100%',
    flexDirection: 'row',
    marginTop: -2,
  },
  pillCol: {
    flex: 1,
    alignItems: 'center',
  },
  pillColBefore: {
    transform: [{ translateX: BRAIN_SCAN_CONTENT_OFFSET }],
  },
  pillColAfter: {
    transform: [{ translateX: RIGHT_BRAIN_LABEL_OFFSET }],
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.neutral[0],
  },
  pillLabel: {
    ...typography.label.small,
    fontSize: 12,
    letterSpacing: 0,
    color: colors.text.primary,
  },
  legend: {
    ...typography.body.small,
    marginTop: spacing.lg,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
