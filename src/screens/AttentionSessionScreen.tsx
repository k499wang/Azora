import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AttentionSessionScreenProps } from '../app/navigation';
import { useCloseOntoHome } from '../app/navigation/useCloseOntoHome';
import { Text } from '../components/common/Text';
import ChunkyButton, { CHUNKY_LIP_DEPTH } from '../components/common/ChunkyButton';
import CloseButton from '../components/common/CloseButton';
import ProgressBar from '../components/common/ProgressBar';
import ScreenContent from '../components/common/ScreenContent';
import AttentionCountDots from '../features/attention/AttentionCountDots';
import AttentionSqueezeShape from '../features/attention/AttentionSqueezeShape';
import { attentionScriptForDate } from '../features/attention/domain/attentionScripts';
import { useAttentionStepCountdown } from '../features/attention/useAttentionStepCountdown';
import { useAttentionTapCount } from '../features/attention/useAttentionTapCount';
import { PROGRAM_ACTIVITIES } from '../features/program/domain/programCatalogue';
import { takeForcedDayComplete } from '../features/room/devDayCompleteOverride';
import { handDayCompleteToHome } from '../features/room/homeDayCompleteHandoff';
import { useRoomClaim } from '../features/room/useRoomClaim';
import { isLastUnfinishedDayUnit } from '../hooks/dayUnits/dayUnit';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useTodayProgramDay } from '../hooks/useTodayProgramDay';
import { triggerLightHaptic, triggerTapHaptic } from '../native/tapHaptics';
import { useCompleteAttentionSessionMutation } from '../queries/program/useCompleteAttentionSessionMutation';
import {
  trackAttentionSessionAbandoned,
  trackAttentionSessionCompleted,
  trackAttentionSessionStarted,
} from '../services/analytics/tracking';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { duration } from '../theme/motion';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const CLOSE_BUTTON_SIZE = 44;
const BUTTON_HEIGHT = 56;

// The new step waits for the old one to fade, so the two never overlap.
const STEP_ENTERING = FadeInDown.duration(duration.slow)
  .delay(duration.fast)
  .withInitialValues({ transform: [{ translateY: spacing.md }] })
  .reduceMotion(ReduceMotion.System);
const STEP_EXITING = FadeOut.duration(duration.fast).reduceMotion(ReduceMotion.System);

function secondsSince(startedAt: number): number {
  return Math.round((Date.now() - startedAt) / 1000);
}

/**
 * A guided attention Reset, one prompt at a time.
 *
 * Tap steps wait for the user, because naming five things takes as long as it
 * takes. Timed steps move on by themselves and show their countdown, so a
 * squeeze is held for its five seconds without anyone counting.
 *
 * Finishing hands the day to Home exactly the way a lesson does: the last
 * unfinished part of the day closes onto Home and celebrates there.
 */
export default function AttentionSessionScreen({
  navigation,
  route,
}: AttentionSessionScreenProps) {
  const { activityId } = route.params;
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const day = useTodayProgramDay(userId).day;
  const roomClaim = useRoomClaim(userId);
  const complete = useCompleteAttentionSessionMutation(userId);
  const closeOntoHome = useCloseOntoHome(navigation);

  const delivery = PROGRAM_ACTIVITIES.get(activityId)?.delivery;
  // Picked once, so a session that runs past midnight keeps its wording.
  const [script] = useState(() =>
    delivery?.modality === 'attention'
      ? attentionScriptForDate(delivery.scriptId, todayLocalDate)
      : null,
  );
  const steps = script?.steps ?? [];

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex] ?? null;
  const isLastStep = stepIndex === steps.length - 1;

  const startedAt = useRef(Date.now());
  const finished = useRef(false);
  const stepIndexRef = useRef(0);

  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);

  useEffect(() => {
    if (script == null) return;
    const props = { activityId, scriptId: script.id };
    trackAttentionSessionStarted(props);
    return () => {
      if (finished.current) return;
      trackAttentionSessionAbandoned({
        ...props,
        durationSeconds: secondsSince(startedAt.current),
        stepIndex: stepIndexRef.current,
        stepCount: script.steps.length,
      });
    };
  }, [activityId, script]);

  const nextStep = useCallback(() => {
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [steps.length]);

  // A step that moves on by itself buzzes into a timed one, so the Reset can be
  // followed with eyes closed. A tap on Next has already buzzed.
  const moveOnByItself = useCallback(() => {
    if (steps[stepIndexRef.current + 1]?.kind === 'timed') triggerLightHaptic();
    nextStep();
  }, [steps, nextStep]);

  const remaining = useAttentionStepCountdown({
    stepKey: stepIndex,
    seconds: step?.kind === 'timed' ? step.seconds : null,
    active: isFocused,
    onElapsed: moveOnByItself,
  });

  const tapCount = useAttentionTapCount({
    stepKey: stepIndex,
    count: step?.kind === 'tap' ? (step.count ?? null) : null,
    onFull: moveOnByItself,
  });

  const finish = () => {
    if (script == null) return;
    finished.current = true;
    trackAttentionSessionCompleted({
      activityId,
      scriptId: script.id,
      durationSeconds: secondsSince(startedAt.current),
    });

    // Only today's own unfinished activity goes to the plan; every other play
    // still counts toward the streak and the free daily exercises.
    const todayActivity = day?.activities.find(
      (activity) => activity.activityId === activityId,
    );
    complete.mutate({
      activityId,
      scriptId: script.id,
      localDate: todayLocalDate,
      planDay:
        day != null && todayActivity != null && !todayActivity.completed
          ? { enrollmentId: day.enrollment.enrollmentId, programDay: day.programDay }
          : null,
    });

    const unit = roomClaim.dailies.units.find((candidate) => candidate.id === activityId);
    if (
      unit != null &&
      (isLastUnfinishedDayUnit(roomClaim.dailies.units, unit.id) ||
        takeForcedDayComplete())
    ) {
      handDayCompleteToHome(unit.id);
      closeOntoHome();
      return;
    }
    navigation.goBack();
  };

  const onNext = () => {
    triggerTapHaptic();
    if (isLastStep) finish();
    else nextStep();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <CloseButton onPress={() => navigation.goBack()} />
        <View style={styles.progress}>
          <ProgressBar progress={steps.length === 0 ? 0 : (stepIndex + 1) / steps.length} />
        </View>
        {/* Balances the close button so the bar sits centred. */}
        <View style={styles.headerSpacer} />
      </View>

      <ScreenContent style={styles.body}>
        <View style={styles.words}>
          {script == null || step == null ? (
            <Text style={styles.prompt}>This Reset isn’t available.</Text>
          ) : (
            <Animated.View
              key={stepIndex}
              entering={STEP_ENTERING}
              exiting={STEP_EXITING}
              style={styles.step}
            >
              {step.label != null ? <Text style={styles.label}>{step.label}</Text> : null}
              <Text style={styles.prompt} accessibilityLiveRegion="polite">
                {step.prompt}
              </Text>
              <Text style={styles.nudge}>{step.nudge}</Text>
            </Animated.View>
          )}
        </View>
        {/* Below the words, so a longer prompt grows upward and never moves the shape. */}
        <View style={styles.stage}>
          {step?.kind === 'timed' ? (
            <Animated.View key="shape" entering={STEP_ENTERING} exiting={STEP_EXITING}>
              <AttentionSqueezeShape phase={step.phase} remaining={remaining ?? step.seconds} />
            </Animated.View>
          ) : step?.count != null ? (
            <Animated.View key={stepIndex} entering={STEP_ENTERING} exiting={STEP_EXITING}>
              <AttentionCountDots
                count={step.count}
                counted={tapCount.counted}
                onCount={tapCount.countOne}
              />
            </Animated.View>
          ) : null}
        </View>
      </ScreenContent>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {script == null ? (
          <ChunkyButton label="Close" minHeight={BUTTON_HEIGHT} onPress={() => navigation.goBack()} />
        ) : step?.kind === 'tap' ? (
          <ChunkyButton
            label={step.count != null && !tapCount.full ? 'Skip' : isLastStep ? 'Done' : 'Next'}
            minHeight={BUTTON_HEIGHT}
            onPress={onNext}
          />
        ) : (
          // Holds the button's place so the prompt does not jump between steps.
          <View style={styles.footerPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
    paddingVertical: spacing.md,
  },
  progress: {
    flex: 1,
  },
  headerSpacer: {
    width: CLOSE_BUTTON_SIZE,
  },
  body: {
    flex: 1,
    paddingHorizontal: padding.screen.horizontal,
  },
  words: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  stage: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  step: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  label: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  prompt: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  nudge: {
    ...typography.body.large,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.md,
  },
  footerPlaceholder: {
    height: BUTTON_HEIGHT + CHUNKY_LIP_DEPTH,
  },
});
