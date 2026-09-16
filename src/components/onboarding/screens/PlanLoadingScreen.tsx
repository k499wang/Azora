import { Text } from '../../common/Text';
import { useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import Icon from '../../common/icons/Icon';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { useSteppedProgress } from '../../../hooks/useSteppedProgress';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import InterruptPrompt from '../InterruptPrompt';

export type PlanLoadingInterruptId = 'sessionTime' | 'checkInTime';

interface PlanLoadingScreenProps {
  onDone: () => void;
  /** Answers here change the plan the next screens render. */
  onAnswerInterrupt: (id: PlanLoadingInterruptId, answer: string) => void;
}

const PERSONALIZING_STEPS = [
  { status: 'Reading how you settle...', item: 'How you settle' },
  { status: 'Finding your stress patterns...', item: 'Your stress' },
  { status: 'Checking how you rest...', item: 'Your sleep' },
  { status: 'Spotting what blocks you...', item: 'What blocks you' },
  { status: 'Shaping your routine...', item: 'Your routine' },
  { status: 'Finishing your plan...' },
];

/**
 * The two questions the build stops to ask. Both move a real plan time, so the
 * answer shows up on the plan itself two screens later rather than as anything
 * on this one.
 */
const INTERRUPTS = [
  {
    id: 'sessionTime' as const,
    at: 0.38,
    question: 'When do the hard moments usually hit?',
    note: 'Your reset gets placed there.',
    options: [
      { id: 'morning', label: 'Mornings' },
      { id: 'evening', label: 'Evenings' },
    ],
  },
  {
    id: 'checkInTime' as const,
    at: 0.72,
    question: 'And your check-in — start of the day, or end of it?',
    note: 'One minute, wherever it lands better.',
    options: [
      { id: 'start', label: 'Start of the day' },
      { id: 'end', label: 'End of the day' },
    ],
  },
];

/** Stable reference: a fresh array here would restart the run every render. */
const INTERRUPT_POINTS = INTERRUPTS.map((interrupt) => interrupt.at);

/** The same shallow lip the option rows and Mochi's bubble sit on. */
const LIP_DEPTH = 3;

const TOTAL_DURATION_MS = 9000;
const HANDOFF_DELAY_MS = 700;

function fireImpact(style: Haptics.ImpactFeedbackStyle) {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(style).catch(() => {});
}

export default function PlanLoadingScreen({
  onDone,
  onAnswerInterrupt,
}: PlanLoadingScreenProps) {
  const [activeInterrupt, setActiveInterrupt] = useState<number | null>(null);
  // Held past the answer so the card keeps its own question while it fades out.
  const [shownInterrupt, setShownInterrupt] = useState(0);
  const checkAnims = useRef(
    PERSONALIZING_STEPS.map(() => new Animated.Value(0)),
  ).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const { progress, percent, completedSteps, isPaused, resume } =
    useSteppedProgress({
      stepCount: PERSONALIZING_STEPS.length,
      totalDurationMs: TOTAL_DURATION_MS,
      interrupts: INTERRUPT_POINTS,
      handoffDelayMs: HANDOFF_DELAY_MS,
      onStepComplete: (index) => {
        fireImpact(Haptics.ImpactFeedbackStyle.Medium);
        Animated.spring(checkAnims[index], {
          toValue: 1,
          damping: 9,
          stiffness: 190,
          mass: 0.6,
          useNativeDriver: true,
        }).start();
      },
      onInterrupt: (index) => {
        setShownInterrupt(index);
        setActiveInterrupt(index);
      },
      onDone: () => {
        if (isHapticsEnabled()) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
        }
        onDoneRef.current();
      },
    });

  const handleAnswer = (answer: string) => {
    if (activeInterrupt == null) return;
    const interrupt = INTERRUPTS[activeInterrupt];
    setActiveInterrupt(null);
    onAnswerInterrupt(interrupt.id, answer);
    resume();
  };

  // Status tracks the fill itself, not the checkmarks, so each line — including
  // the last — is on screen while its leg is still running.
  const statusIndex = Math.min(
    Math.floor((percent / 100) * PERSONALIZING_STEPS.length),
    PERSONALIZING_STEPS.length - 1,
  );

  return (
    <View style={styles.screen}>
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
            {isPaused
              ? 'One thing before we finish...'
              : PERSONALIZING_STEPS[statusIndex].status}
          </Text>

          <View style={[card.base, styles.card]}>
            <Text style={styles.cardTitle}>Personalizing for you</Text>
            {PERSONALIZING_STEPS.map((step, i) =>
              step.item ? (
                <View key={step.item} style={styles.itemRow}>
                  <Text style={styles.itemLabel}>{`\u2022  ${step.item}`}</Text>
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

      <InterruptPrompt
        visible={activeInterrupt != null}
        question={INTERRUPTS[shownInterrupt].question}
        note={INTERRUPTS[shownInterrupt].note}
        options={INTERRUPTS[shownInterrupt].options}
        onAnswer={handleAnswer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingBody: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing['4xl'],
  },
  percent: {
    ...typography.display.display1,
    fontFamily: fonts.semibold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1,
    textAlign: 'center',
    color: colors.text.primary,
  },
  headline: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
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
    backgroundColor: colors.primary.blue500,
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
    // the lip is a thicker bottom edge, so the extra depth comes out of the
    // padding rather than making the card taller than its siblings
    paddingBottom: spacing.lg - LIP_DEPTH,
    borderBottomWidth: LIP_DEPTH,
    borderBottomColor: colors.neutral[200],
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
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
    backgroundColor: colors.primary.blue500,
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
