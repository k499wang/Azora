import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon, { IconName } from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface BaselineScienceScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

type ScienceStep = {
  icon: IconName;
  title: string;
  detail: string;
};

const SCIENCE_STEPS: ScienceStep[] = [
  {
    icon: 'sun',
    title: 'Light into your fingertip',
    detail: 'The phone’s flash shines steadily through your skin.',
  },
  {
    icon: 'heart',
    title: 'Each beat shifts the light',
    detail:
      'Blood volume rises and falls with every heartbeat, changing how much light reflects back.',
  },
  {
    icon: 'stat-rmssd-wave',
    title: 'We extract your rhythm',
    detail:
      'The camera reads those tiny shifts 30 times a second — the same method clinical pulse oximeters use.',
  },
  {
    icon: 'timer',
    title: 'This check uses live BPM',
    detail:
      'Onboarding uses the live pulse stream to compare your early and late BPM ' +
      'during the reading. The full heart-rate tool runs a longer capture to calculate HRV stats.',
  },
];

const TIPS = [
  'Warm, dry hands give the cleanest signal',
  'Cover the lens and flash fully with one fingertip',
  'Gentle pressure — enough to seal the lens, not enough to cut off blood flow',
  'Stay still and quiet for the full 20 seconds',
];

export default function BaselineScienceScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: BaselineScienceScreenProps) {
  const rowAnims = useRef(SCIENCE_STEPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.selectionAsync().catch(() => {});
    }
    Animated.stagger(
      120,
      rowAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 460,
          delay: 60,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [rowAnims]);

  return (
    <OnboardingScreenLayout
      title="How we read your heart"
      subtitle="Your phone already has everything it needs."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Got it" onPress={onContinue} />}
    >
      <View style={styles.list}>
        {SCIENCE_STEPS.map((item, i) => (
          <Animated.View
            key={item.icon}
            style={[
              styles.row,
              {
                opacity: rowAnims[i],
                transform: [
                  {
                    translateY: rowAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.iconWell}>
              <Icon name={item.icon} size={22} color={colors.primary.blue600} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDetail}>{item.detail}</Text>
            </View>
            {i < SCIENCE_STEPS.length - 1 && <View style={styles.divider} />}
          </Animated.View>
        ))}
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>For a clean reading</Text>
        {TIPS.map((tip) => (
          <View key={tip} style={styles.tipRow}>
            <View style={styles.checkBadge}>
              <Icon name="check" size={12} color={colors.primary.blue700} />
            </View>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
        <Text style={styles.warningNote}>
          Cold hands, bright sunlight, or movement can weaken the signal — we’ll
          tell you if that happens.
        </Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    position: 'relative',
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.background.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
    paddingTop: 2,
  },
  rowTitle: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  rowDetail: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 44 + spacing.md,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },
  tipsCard: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  tipsTitle: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipText: {
    ...typography.body.small,
    flex: 1,
    color: colors.text.secondary,
  },
  warningNote: {
    ...typography.body.xsmall,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
});
