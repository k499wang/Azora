import { Text } from '../../common/Text';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import Icon from '../../common/icons/Icon';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';

interface PlanLoadingScreenProps {
  onDone: () => void;
}

const PERSONALIZING_STEPS = [
  {
    status: 'Reading your heart-rate pattern...',
    item: 'Heart profile',
  },
  {
    status: 'Mapping your stress signals...',
    item: 'Stress signals',
  },
  {
    status: 'Checking your sleep and recovery...',
    item: 'Sleep & recovery',
  },
  {
    status: 'Estimating your focus window...',
    item: 'Focus window',
  },
  {
    status: 'Tuning your daily rhythm...',
    item: 'Daily rhythm',
  },
  {
    status: 'Finishing your plan...',
  },
];

const STEP_DURATION_MS = 1500;
const HANDOFF_DELAY_MS = 700;

function fireImpact(style: Haptics.ImpactFeedbackStyle) {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(style).catch(() => {});
}

export default function PlanLoadingScreen({ onDone }: PlanLoadingScreenProps) {
  const [completedSteps, setCompletedSteps] = useState(0);
  const [percent, setPercent] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const checkAnims = useRef(
    PERSONALIZING_STEPS.map(() => new Animated.Value(0)),
  ).current;
  const legSpeeds = useRef(
    PERSONALIZING_STEPS.map(() => 0.65 + Math.random() * 0.8),
  ).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setPercent(Math.round(value * 100));
    });
    return () => progress.removeListener(id);
  }, [progress]);

  useEffect(() => {
    let cancelled = false;
    let handoffTimer: ReturnType<typeof setTimeout>;
    const stepCount = PERSONALIZING_STEPS.length;

    // One bar walks the whole way; each leg lands exactly on its item's share of
    // the track so the checkmark and the percentage never drift apart. Legs run
    // linear so the fill never decelerates to a stall at a junction — only the
    // leg durations vary, which reads as real work speeding up and slowing down.
    // The first leg eases in and the last eases out so the run as a whole still
    // starts and settles softly.
    const runStep = (i: number) => {
      const easing =
        i === 0
          ? Easing.in(Easing.quad)
          : i === stepCount - 1
            ? Easing.out(Easing.quad)
            : Easing.linear;
      Animated.timing(progress, {
        toValue: (i + 1) / stepCount,
        duration: STEP_DURATION_MS * legSpeeds[i],
        easing,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished || cancelled) return;
        fireImpact(Haptics.ImpactFeedbackStyle.Medium);
        setCompletedSteps(i + 1);
        Animated.spring(checkAnims[i], {
          toValue: 1,
          damping: 9,
          stiffness: 190,
          mass: 0.6,
          useNativeDriver: true,
        }).start();
        if (i + 1 < stepCount) {
          runStep(i + 1);
          return;
        }
        handoffTimer = setTimeout(() => {
          if (cancelled) return;
          if (isHapticsEnabled()) {
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => {});
          }
          onDoneRef.current();
        }, HANDOFF_DELAY_MS);
      });
    };
    runStep(0);

    return () => {
      cancelled = true;
      progress.stopAnimation();
      checkAnims.forEach((anim) => anim.stopAnimation());
      clearTimeout(handoffTimer);
    };
  }, [progress, checkAnims, legSpeeds]);

  // Status tracks the fill itself, not the checkmarks, so each line — including
  // the last — is on screen while its leg is still running.
  const statusIndex = Math.min(
    Math.floor((percent / 100) * PERSONALIZING_STEPS.length),
    PERSONALIZING_STEPS.length - 1,
  );

  return (
    <OnboardingScreenLayout title="" footer={<View />}>
      <View style={styles.loadingBody}>
        <Text style={styles.percent}>{percent}%</Text>
        <Text style={styles.headline}>We&apos;re building your plan</Text>

        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <Text style={styles.status}>
          {PERSONALIZING_STEPS[statusIndex].status}
        </Text>

        <View style={[card.base, styles.card]}>
          <Text style={styles.cardTitle}>Personalizing for you</Text>
          {PERSONALIZING_STEPS.map((step, i) =>
            step.item ? (
              <View key={step.item} style={styles.itemRow}>
                <Text style={styles.itemLabel}>{`•  ${step.item}`}</Text>
                {completedSteps > i ? (
                  <Animated.View
                    style={[
                      styles.itemCheck,
                      { transform: [{ scale: checkAnims[i] }] },
                    ]}
                  >
                    <Icon name="check" size={12} color={colors.text.inverse} />
                  </Animated.View>
                ) : (
                  <View style={styles.itemCheckPending} />
                )}
              </View>
            ) : null,
          )}
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingBody: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing['4xl'],
  },
  percent: {
    ...typography.display.display1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1,
    textAlign: 'center',
    color: colors.text.primary,
  },
  headline: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.4,
    textAlign: 'center',
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary.blue100,
    overflow: 'hidden',
    marginTop: spacing['2xl'],
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
  },
  status: {
    ...typography.body.small,
    textAlign: 'center',
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.background.card,
    marginTop: spacing['3xl'],
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemLabel: {
    ...typography.body.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  itemCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCheckPending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
});
