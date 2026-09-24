import { entranceTiming } from '../entranceTiming';
import { Text } from '../../common/Text';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { isShortScreen } from '../../../theme/breakpoints';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import AzoAside from '../AzoAside';

const BRAIN_SCAN_ASPECT_RATIO = 3 / 2;
const BRAIN_SCAN_CONTENT_OFFSET = -12;
const RIGHT_BRAIN_LABEL_OFFSET = 14;
const MOCHI_NOTE =
  'CBT teaches your brain to start small. Structure your day, and focus follows.';

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
  const { height } = useWindowDimensions();
  const compact = isShortScreen(height);
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    Animated.timing(reveal, {
      toValue: 1,
      duration: entranceTiming.visual,
      delay: entranceTiming.visualDelay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reveal]);

  return (
    <OnboardingScreenLayout
      title="Azora uses CBT techniques to help ADHD brains focus."
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerBody={!compact}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.body}>
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
              source={getOnboardingImageSource('brainScan')}
              style={styles.scans}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
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
        </Animated.View>

        <AzoAside
          text={MOCHI_NOTE}
          expression="thinking"
          wearing="glasses"
        />
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing['2xl'],
  },
  visual: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.background.card,
  },
  pillLabel: {
    ...typography.label.medium,
    fontSize: 14,
    letterSpacing: 0,
    color: colors.text.primary,
  },
});
