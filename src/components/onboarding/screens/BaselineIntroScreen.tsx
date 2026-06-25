import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface BaselineIntroScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const ECG_WIDTH = 320;
const ECG_HEIGHT = 140;
const BASELINE = ECG_HEIGHT / 2;
const CYCLE = 80;
const CYCLES_VISIBLE = ECG_WIDTH / CYCLE;
const CYCLES_TOTAL = CYCLES_VISIBLE * 2;

function buildEcgPath(): string {
  let d = `M 0 ${BASELINE}`;
  for (let i = 0; i < CYCLES_TOTAL; i++) {
    const x = i * CYCLE;
    d += ` L ${x + 18} ${BASELINE}`;
    d += ` Q ${x + 20} ${BASELINE - 5} ${x + 22} ${BASELINE}`;
    d += ` L ${x + 30} ${BASELINE}`;
    d += ` L ${x + 32} ${BASELINE + 3}`;
    d += ` L ${x + 34} ${BASELINE - 44}`;
    d += ` L ${x + 36} ${BASELINE + 26}`;
    d += ` L ${x + 38} ${BASELINE}`;
    d += ` L ${x + 44} ${BASELINE}`;
    d += ` Q ${x + 47} ${BASELINE - 8} ${x + 50} ${BASELINE}`;
    d += ` L ${x + CYCLE} ${BASELINE}`;
  }
  return d;
}

export default function BaselineIntroScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: BaselineIntroScreenProps) {
  const scroll = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  const ecgPath = useMemo(() => buildEcgPath(), []);

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.timing(scroll, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [scroll, fade, rise]);

  const translateX = scroll.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -ECG_WIDTH],
  });

  const title = 'Let’s read your heart.';

  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="I’m ready" onPress={onContinue} />}
    >
      <Animated.View
        style={[
          styles.stage,
          { opacity: fade, transform: [{ translateY: rise }] },
        ]}
      >
        <MaskedView
          style={styles.monitor}
          maskElement={
            <LinearGradient
              colors={[
                'transparent',
                '#000',
                '#000',
                'transparent',
              ]}
              locations={[0, 0.18, 0.82, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <View style={styles.gridLineTop} />
          <View style={styles.gridLineMid} />
          <View style={styles.gridLineBottom} />

          <Animated.View
            style={[
              styles.ecgTrack,
              { transform: [{ translateX }] },
            ]}
          >
            <Svg width={ECG_WIDTH * 2} height={ECG_HEIGHT}>
              <Path
                d={ecgPath}
                stroke={colors.primary.blue200}
                strokeWidth={4}
                strokeOpacity={0.35}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d={ecgPath}
                stroke={colors.primary.blue600}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Animated.View>
        </MaskedView>

        <View style={styles.copy}>
          <Text style={styles.headline}>{title}</Text>
          <Text style={styles.sub}>
            Azora uses PPG to read your heart rate and build a custom plan.
          </Text>
        </View>
      </Animated.View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  monitor: {
    width: ECG_WIDTH,
    height: ECG_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  ecgTrack: {
    width: ECG_WIDTH * 2,
    height: ECG_HEIGHT,
  },
  gridLineTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: BASELINE - 44,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.primary.blue100,
  },
  gridLineMid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: BASELINE,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.primary.blue200,
    opacity: 0.6,
  },
  gridLineBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: BASELINE + 28,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.primary.blue100,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.text.primary,
    textAlign: 'center',
  },
  sub: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
