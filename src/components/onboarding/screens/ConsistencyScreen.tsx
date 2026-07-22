import { Text } from '../../common/Text';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface ConsistencyScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const HEIGHTS = [0.28, 0.36, 0.47, 0.55, 0.68, 0.82, 1];
const CHART_HEIGHT = 200;

export default function ConsistencyScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: ConsistencyScreenProps) {
  const barAnims = useRef(DAYS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      110,
      barAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          damping: 15,
          stiffness: 160,
          useNativeDriver: false,
        }),
      ),
    ).start(() => {
      if (isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    });
  }, [barAnims]);

  return (
    <OnboardingScreenLayout
      title="Consistency is what creates real change."
      subtitle="Consistency is where you'll actually see results. Each session builds on the last."
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerBody
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.chartWrap}>
        <Text style={styles.chartTitle}>Overall Wellbeing</Text>

        <View style={styles.plot}>
          <View style={styles.bars}>
            {DAYS.map((_, index) => {
              const anim = barAnims[index];
              const isPeak = index === DAYS.length - 1;
              return (
                <View key={index} style={styles.barColumn}>
                  <Animated.View
                    style={[
                      styles.bar,
                      isPeak && styles.barPeak,
                      {
                        height: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [4, CHART_HEIGHT * HEIGHTS[index]],
                        }),
                        opacity: anim.interpolate({
                          inputRange: [0, 0.2, 1],
                          outputRange: [0, 1, 1],
                        }),
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.labelRow}>
          {DAYS.map((label, index) => {
            const isPeak = index === DAYS.length - 1;
            return (
              <View key={index} style={styles.barColumn}>
                <Text style={[styles.dayLabel, isPeak && styles.dayLabelPeak]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.caption}>Your first week</Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  chartWrap: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  chartTitle: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  plot: {
    width: '100%',
    height: CHART_HEIGHT + 24,
    paddingTop: 24,
    paddingLeft: spacing.sm,
    borderBottomWidth: 1.5,
    borderColor: colors.neutral[300],
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingLeft: spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 26,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: colors.primary.blue300,
  },
  barPeak: {
    backgroundColor: colors.primary.blue600,
  },
  dayLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  dayLabelPeak: {
    color: colors.text.primary,
  },
  caption: {
    ...typography.body.small,
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
