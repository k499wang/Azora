import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import Animated, {
  cancelAnimation,
  Keyframe,
  LayoutAnimationConfig,
  useAnimatedStyle,
  LinearTransition,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type EntryExitAnimationFunction,
  type SharedValue,
} from 'react-native-reanimated';
import type { RoutinePlayerScreenProps } from '../app/navigation';
import { useAfterScreenClosed } from '../app/navigation/useAfterScreenClosed';
import ChunkyButton from '../components/common/ChunkyButton';
import CoinFlightLayer from '../components/common/CoinFlightLayer';
import ConfettiFall from '../components/common/ConfettiFall';
import EarnedCoinBalance from '../components/common/EarnedCoinBalance';
import HeaderStripStatCard, {
  EarnedCoinsCard,
  HeaderStripStatRow,
} from '../components/common/HeaderStripStatCard';
import { Land } from '../components/common/Reveal';
import BottomSheet from '../components/common/BottomSheet';
import { Text } from '../components/common/Text';
import Icon from '../components/common/icons/Icon';
import TaskIllustration from '../components/common/icons/TaskIllustration';
import {
  buildRoutinePlayerSteps,
  createRoutinePlayerState,
  currentRoutineStep,
  isRoutinePlayerFinished,
  nextRoutineStep,
  ROUTINE_FINISHED_LINE,
  ROUTINE_TIME_UP_LINE,
  routineAllEndsAt,
  routinePlayerReducer,
  routinePlayerSummary,
  routineStepAnnouncement,
  routineStepClock,
  routineStepMinutes,
  routineTimeOfDay,
  type RoutinePlayerAction,
  type RoutinePlayerState,
} from '../features/selfCare/domain/routinePlayer';
import { useFirstWinOfDay } from '../features/selfCare/useFirstWinOfDay';
import { useFirstWinOfDayStore } from '../features/selfCare/firstWinOfDayStore';
import { useRoutineStepTimer } from '../features/selfCare/useRoutineStepTimer';
import { speakRoutineLine, stopRoutineVoice } from '../features/selfCare/routineVoice';
import {
  cancelRoutineStepAlert,
  scheduleRoutineStepAlert,
} from '../features/selfCare/routineStepNotification';
import { useAudioPreferences } from '../features/audioSettings';
import TaskCardBody, {
  taskCard,
  TASK_TITLE_MAX_LINES,
} from '../components/home/journey/TaskCardBody';
import ActivityCompletionContent from '../features/plan/ActivityCompletionContent';
import RoutineTaskIcon from '../features/selfCare/RoutineTaskIcon';
import { selfCareGoalCoins } from '../features/selfCare/domain/selfCareGoal';
import LipToken, { type LipTone } from '../features/plan/LipToken';
import { REWARD_BEAT, rewardCardEnterAt } from '../features/plan/rewardEntrance';
import { useCoinRewardFlight } from '../hooks/useCoinRewardFlight';
import { useCompletionHaptic } from '../hooks/useCompletionHaptic';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import {
  triggerActivityCompleteHaptic,
  triggerSoftHaptic,
  triggerTapHaptic,
} from '../native/tapHaptics';
import { useSelfCareGoalsQuery } from '../queries/selfCare/useSelfCareGoalsQuery';
import { useToggleSelfCareGoalMutation } from '../queries/selfCare/useToggleSelfCareGoalMutation';
import { getWalletQueryKey } from '../queries/wallet/useWalletQuery';
import {
  trackRoutinePlayerFinished,
  trackRoutinePlayerStarted,
  trackRoutinePlayerStep,
} from '../services/analytics/tracking';
import { useAuthStore } from '../stores/authStore';
import { radius } from '../theme/card';
import { colors } from '../theme/colors';
import { duration, easing } from '../theme/motion';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const DISC_WIDTH_SHARE = 0.7;
const ARC_STROKE_SHARE = 0.075;
const KNOB_SHARE = 0.3;
const ICON_SHARE = 0.25;
const TITLE_FONT_SHARE = 0.08;
const CLOCK_FONT_SHARE = 0.15;
const LINE_HEIGHT_RATIO = 1.2;
/** Twelve o'clock, so the arc grows clockwise from the top; just short of a full turn so it stays one open path. */
const ARC_START_ANGLE = -90;
const ARC_SWEEP = 359.9;
const HEADER_BUTTON_SIZE = 40;
const HEADER_ICON_SIZE = 18;
const SIDE_ICON_SIZE = 36;
const PLAY_ICON_SIZE = 28;
const DONE_SIZE = 80;
const DONE_ICON_SIZE = 32;
const DONE_TONE: LipTone = {
  face: colors.text.primary,
  lip: colors.neutral[800],
  icon: colors.text.inverse,
};
const DIGIT_ROLL_MS = 200;
const STEP_SHIFT = 16;
const PILL_PRESS_SCALE = 0.8;
const LENGTH_POP_SCALE = 1.06;
const PULSE_SCALE = 1.06;
const PULSE_MS = 700;
const RECAP_CHECK_SIZE = 24;
const MOVE_BUTTON_SIZE = 36;
const MOVE_ICON_SIZE = 18;
const RECAP_CHECK_ICON_SIZE = 15;

export default function RoutinePlayerScreen({
  navigation,
  route,
}: RoutinePlayerScreenProps) {
  useKeepAwake();
  const { goalIds } = route.params;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const goalsQuery = useSelfCareGoalsQuery(userId, todayLocalDate);
  const toggleGoal = useToggleSelfCareGoalMutation(userId, todayLocalDate);
  const firstWin = useFirstWinOfDay(userId);
  const {
    preferences: audioPreferences,
    loaded: voiceLoaded,
    setRoutineVoice,
    setRoutineAutoAdvance,
  } = useAudioPreferences();
  const voiceOn = audioPreferences.routineVoice;
  const autoAdvance = audioPreferences.routineAutoAdvance;
  const voiceOnRef = useRef(voiceOn);
  voiceOnRef.current = voiceOn;
  const speak = useCallback((line: string) => {
    if (voiceOnRef.current) speakRoutineLine(line);
  }, []);
  useEffect(() => stopRoutineVoice, []);

  useAfterScreenClosed(navigation, () => {
    useFirstWinOfDayStore.getState().revealAfterClose();
  });

  // Built once from the first list that loads: ticking a step updates the same
  // cache, and rebuilding from it would drop the step just finished.
  const [player, setPlayer] = useState<RoutinePlayerState | null>(null);
  const goals = goalsQuery.data;
  useEffect(() => {
    if (player != null || goals == null) return;
    const steps = buildRoutinePlayerSteps(goals, goalIds);
    setPlayer(createRoutinePlayerState(steps));
    if (steps.length > 0) trackRoutinePlayerStarted({ stepCount: steps.length });
  }, [player, goals, goalIds]);

  const dispatch = useCallback((action: RoutinePlayerAction) => {
    setPlayer((current) =>
      current == null ? current : routinePlayerReducer(current, action),
    );
  }, []);

  const step = player == null ? null : currentRoutineStep(player);
  const next = player == null ? null : nextRoutineStep(player);
  const finished = player != null && isRoutinePlayerFinished(player);
  const minutes = player == null ? null : routineStepMinutes(player, player.index);
  const durationMs = minutes == null ? null : minutes * 60_000;

  const [paused, setPaused] = useState(false);
  const [rearranging, setRearranging] = useState(false);
  const upcomingCount = player == null ? 0 : Math.max(0, player.steps.length - player.index - 1);
  const stepKey = step == null ? 'none' : `${player?.index}:${step.id}`;
  useEffect(() => setPaused(false), [stepKey]);

  const timer = useRoutineStepTimer({
    active: step != null,
    paused,
    durationMs,
    stepKey,
    onElapsed: () => {
      if (autoAdvance) {
        complete();
        return;
      }
      triggerSoftHaptic();
      speak(ROUTINE_TIME_UP_LINE);
    },
  });
  const timeUp = durationMs != null && timer.fill === 0;

  const secondsLeft = useRef(timer.seconds);
  secondsLeft.current = timer.seconds;
  const stepTitle = step?.title ?? null;
  const nextTitle = next?.title ?? null;
  useEffect(() => {
    if (stepTitle == null || durationMs == null || paused) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        cancelRoutineStepAlert();
        return;
      }
      if (state !== 'background' || secondsLeft.current <= 0) return;
      scheduleRoutineStepAlert({
        stepTitle,
        nextTitle,
        at: new Date(Date.now() + secondsLeft.current * 1000),
      });
    });
    return () => {
      subscription.remove();
      cancelRoutineStepAlert();
    };
  }, [stepKey, stepTitle, nextTitle, durationMs, paused]);

  const announcement =
    step == null ? null : routineStepAnnouncement(step, minutes, next == null);
  const announcementRef = useRef(announcement);
  announcementRef.current = announcement;
  useEffect(() => {
    if (!voiceLoaded || announcementRef.current == null) return;
    speak(announcementRef.current);
  }, [stepKey, voiceLoaded, speak]);

  const hasSteps = player != null && player.steps.length > 0;
  useEffect(() => {
    if (voiceLoaded && finished && hasSteps) speak(ROUTINE_FINISHED_LINE);
  }, [finished, hasSteps, voiceLoaded, speak]);

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (timeUp) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(PULSE_SCALE, { duration: PULSE_MS, easing: easing.breathe }),
          withTiming(1, { duration: PULSE_MS, easing: easing.breathe }),
        ),
        -1,
      );
      return;
    }
    cancelAnimation(pulse);
    pulse.value = withTiming(1, { duration: PULSE_MS });
  }, [timeUp, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const finishTracked = useRef(false);
  useEffect(() => {
    if (!finished || player == null || player.steps.length === 0) return;
    if (finishTracked.current) return;
    finishTracked.current = true;
    const { done, skipped } = routinePlayerSummary(player);
    trackRoutinePlayerFinished({ done, skipped });
  }, [finished, player]);

  // A second tap on the same step, before it has moved on, does nothing.
  const handledIndex = useRef(-1);
  const takeStep = () => {
    if (player == null || step == null) return null;
    if (handledIndex.current === player.index) return null;
    handledIndex.current = player.index;
    return step;
  };

  const complete = () => {
    const goal = takeStep();
    if (goal == null) return;
    triggerActivityCompleteHaptic();
    const isFirstWinToday = firstWin.claim();
    toggleGoal
      .toggle({ goalId: goal.id, completed: true })
      .then(() => {
        if (isFirstWinToday) {
          useFirstWinOfDayStore.getState().show({ heldForClose: true });
        }
      })
      .catch(() => {
        if (isFirstWinToday) firstWin.release();
      });
    trackRoutinePlayerStep({ outcome: 'done', hadTimer: goal.durationMinutes != null });
    dispatch({ type: 'complete' });
  };

  const skip = () => {
    const goal = takeStep();
    if (goal == null) return;
    trackRoutinePlayerStep({ outcome: 'skipped', hadTimer: goal.durationMinutes != null });
    dispatch({ type: 'skip' });
  };

  const close = () => {
    stopRoutineVoice();
    navigation.goBack();
  };
  const discSize = Math.round(width * DISC_WIDTH_SHARE);
  const clockFontSize = Math.round(width * CLOCK_FONT_SHARE);
  const allEndsAt =
    player == null ? null : routineAllEndsAt(player, Date.now(), timer.seconds * 1000);
  const nextMinutes =
    player == null || next == null ? null : routineStepMinutes(player, player.index + 1);
  const nextDetail =
    [
      nextMinutes == null ? null : `${nextMinutes} min`,
      allEndsAt == null ? null : `All ends ${routineTimeOfDay(allEndsAt)}`,
    ]
      .filter((part) => part != null)
      .join(' · ') || null;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md },
      ]}
    >
      {finished ? null : (
      <View style={styles.header}>
        <View style={styles.headerGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={voiceOn ? 'Voice guide on' : 'Voice guide off'}
            hitSlop={spacing.sm}
            onPress={() => {
              triggerTapHaptic();
              if (voiceOn) stopRoutineVoice();
              setRoutineVoice(!voiceOn);
            }}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Icon
              name={voiceOn ? 'volume-high' : 'volume-off'}
              size={HEADER_ICON_SIZE}
              color={colors.text.secondary}
            />
          </Pressable>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Start the next step when time is up"
            accessibilityState={{ checked: autoAdvance }}
            hitSlop={spacing.sm}
            onPress={() => {
              triggerTapHaptic();
              setRoutineAutoAdvance(!autoAdvance);
            }}
            style={({ pressed }) => [
              styles.headerButton,
              autoAdvance && styles.headerButtonOn,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              name="auto-advance"
              size={HEADER_ICON_SIZE}
              color={autoAdvance ? colors.text.brand : colors.text.secondary}
            />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={spacing.sm}
          onPress={() => {
            triggerTapHaptic();
            close();
          }}
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <Icon name="close" size={HEADER_ICON_SIZE} color={colors.text.secondary} />
        </Pressable>
      </View>
      )}

      {player == null ? null : finished ? (
        <FinishedView player={player} userId={userId} onDone={close} />
      ) : step == null ? null : (
        <View style={styles.body}>
          <Animated.View key={stepKey} entering={stepEntering} style={styles.titleBlock}>
            <Text
              style={[
                styles.title,
                { fontSize: Math.round(width * TITLE_FONT_SHARE) },
                { lineHeight: Math.round(width * TITLE_FONT_SHARE * LINE_HEIGHT_RATIO) },
              ]}
              accessibilityRole="header"
            >
              {step.title}
            </Text>
          </Animated.View>

          <View style={[styles.disc, { width: discSize, height: discSize, borderRadius: discSize / 2 }]}>
            <StepArc
              size={discSize}
              stroke={Math.round(discSize * ARC_STROKE_SHARE)}
              progress={timer.progress}
              timed={durationMs != null}
            />
            <Animated.View key={stepKey} entering={stepEntering}>
              <TaskIllustration
                name={step.icon}
                size={Math.round(discSize * ICON_SHARE)}
              />
            </Animated.View>
            <RollingClock
              text={routineStepClock(timer.seconds)}
              fontSize={clockFontSize}
              accessibilityLabel={
                durationMs == null
                  ? `${routineStepClock(timer.seconds)} so far`
                  : `${routineStepClock(timer.seconds)} left`
              }
            />
            {minutes == null ? null : (
              <LengthPill
                key={step.id}
                minutes={minutes}
                onLess={() => dispatch({ type: 'removeMinute' })}
                onMore={() => dispatch({ type: 'addMinute' })}
              />
            )}
          </View>

          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={paused ? 'Resume' : 'Pause'}
              hitSlop={spacing.sm}
              onPress={() => {
                triggerTapHaptic();
                setPaused((current) => !current);
              }}
              style={({ pressed }) => [styles.sideControl, pressed && styles.pressed]}
            >
              <Icon
                name={paused ? 'play-triangle' : 'pause'}
                size={paused ? PLAY_ICON_SIZE : SIDE_ICON_SIZE}
                color={colors.neutral[400]}
              />
            </Pressable>
            <Animated.View style={pulseStyle}>
              <LipToken
                size={DONE_SIZE}
                tone={DONE_TONE}
                accessibilityLabel={`Done with ${step.title}`}
                onPress={complete}
              >
                <Icon bold name="check-bold" size={DONE_ICON_SIZE} color={DONE_TONE.icon} />
              </LipToken>
            </Animated.View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip"
              hitSlop={spacing.sm}
              onPress={() => {
                triggerTapHaptic();
                skip();
              }}
              style={({ pressed }) => [styles.sideControl, pressed && styles.pressed]}
            >
              <Icon name="skip-next" size={SIDE_ICON_SIZE} color={colors.neutral[400]} />
            </Pressable>
          </View>

          <View style={[taskCard.surface, taskCard.face, styles.nextCard]}>
            <TaskCardBody
              icon={<RoutineTaskIcon name={next == null ? 'celebration' : next.icon} />}
              badge={
                upcomingCount < 2 ? null : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Rearrange the steps to come"
                    hitSlop={spacing.sm}
                    onPress={() => {
                      triggerTapHaptic();
                      setRearranging(true);
                    }}
                    style={({ pressed }) => [styles.rearrangePill, pressed && styles.pressed]}
                  >
                    <Text style={styles.rearrangeLabel}>Rearrange</Text>
                  </Pressable>
                )
              }
            >
              <Text style={taskCard.overline}>{next == null ? 'LAST ONE' : 'UP NEXT'}</Text>
              <Text numberOfLines={1} style={taskCard.title}>
                {next == null ? 'Then you’re done' : next.title}
              </Text>
              {nextDetail == null ? null : (
                <Text style={taskCard.detail}>{nextDetail}</Text>
              )}
            </TaskCardBody>
          </View>
        </View>
      )}

      <BottomSheet
        visible={rearranging && upcomingCount >= 2}
        onClose={() => setRearranging(false)}
        title="Rearrange"
        subtitle="What’s coming up, in the order you’ll do it."
      >
        {player == null ? null : (
          <View style={styles.rearrangeList}>
            {player.steps.slice(player.index + 1).map((goal, offset) => {
              const at = player.index + 1 + offset;
              const length = routineStepMinutes(player, at);
              return (
                <Animated.View
                  key={goal.id}
                  layout={LinearTransition.duration(duration.base)}
                  style={[taskCard.surface, taskCard.face]}
                >
                  <TaskCardBody
                    icon={<RoutineTaskIcon name={goal.icon} />}
                    badge={
                      <View style={styles.rearrangeMoves}>
                        <MoveButton
                          icon="arrow-up"
                          accessibilityLabel={`Move ${goal.title} earlier`}
                          disabled={offset === 0}
                          onPress={() => dispatch({ type: 'moveUpcoming', from: at, to: at - 1 })}
                        />
                        <MoveButton
                          icon="arrow-down"
                          accessibilityLabel={`Move ${goal.title} later`}
                          disabled={at === player.steps.length - 1}
                          onPress={() => dispatch({ type: 'moveUpcoming', from: at, to: at + 1 })}
                        />
                      </View>
                    }
                  >
                    <Text numberOfLines={2} style={taskCard.title}>{goal.title}</Text>
                    <Text style={taskCard.detail}>
                      {length == null ? 'No timer' : `${length} min`}
                    </Text>
                  </TaskCardBody>
                </Animated.View>
              );
            })}
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const stepEntering: EntryExitAnimationFunction = () => {
  'worklet';
  const config = { duration: duration.base, easing: easing.enter };
  return {
    initialValues: {
      opacity: 0,
      transform: [{ translateX: STEP_SHIFT }],
    },
    animations: {
      opacity: withTiming(1, config),
      transform: [{ translateX: withTiming(0, config) }],
    },
  };
};

interface MoveButtonProps {
  icon: 'arrow-up' | 'arrow-down';
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}

function MoveButton({ icon, accessibilityLabel, disabled, onPress }: MoveButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={spacing.xs}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.moveButton, pressed && styles.pressed]}
    >
      <Icon
        name={icon}
        size={MOVE_ICON_SIZE}
        color={disabled ? colors.neutral[300] : colors.text.secondary}
      />
    </Pressable>
  );
}

interface StepArcProps {
  size: number;
  stroke: number;
  progress: SharedValue<number>;
  /** an open-ended step keeps the ring but has no time to fill it with */
  timed: boolean;
}

/** Grows clockwise from twelve o'clock, with a knob riding its leading end. */
function StepArc({ size, stroke, progress, timed }: StepArcProps) {
  const center = size / 2;
  const radius = center - stroke / 2;
  const path = useMemo(() => {
    const circle = Skia.Path.Make();
    circle.addArc(
      Skia.XYWHRect(center - radius, center - radius, radius * 2, radius * 2),
      ARC_START_ANGLE,
      ARC_SWEEP,
    );
    return circle;
  }, [center, radius]);
  const knobX = useDerivedValue(
    () => center + radius * Math.cos(-Math.PI / 2 + 2 * Math.PI * progress.value),
  );
  const knobY = useDerivedValue(
    () => center + radius * Math.sin(-Math.PI / 2 + 2 * Math.PI * progress.value),
  );

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Circle
        cx={center}
        cy={center}
        r={radius}
        style="stroke"
        strokeWidth={stroke}
        color={colors.primary.blue100}
      />
      {timed ? (
        <>
          <Path
            path={path}
            style="stroke"
            strokeWidth={stroke}
            strokeCap="round"
            color={colors.primary.blue500}
            start={0}
            end={progress}
          />
          <Circle cx={knobX} cy={knobY} r={stroke * KNOB_SHARE} color={colors.neutral[0]} />
        </>
      ) : null}
    </Canvas>
  );
}

interface RollingClockProps {
  text: string;
  fontSize: number;
  accessibilityLabel: string;
}

/** Each character rolls up out of its slot when it changes; the rest stay still. */
function RollingClock({ text, fontSize, accessibilityLabel }: RollingClockProps) {
  const lineHeight = Math.round(fontSize * LINE_HEIGHT_RATIO);
  const [rollIn, rollOut] = useMemo(
    () => [
      new Keyframe({
        0: { opacity: 0, transform: [{ translateY: lineHeight }] },
        100: { opacity: 1, transform: [{ translateY: 0 }], easing: easing.enter },
      }).duration(DIGIT_ROLL_MS),
      new Keyframe({
        0: { opacity: 1, transform: [{ translateY: 0 }] },
        100: { opacity: 0, transform: [{ translateY: -lineHeight }], easing: easing.exit },
      }).duration(DIGIT_ROLL_MS),
    ],
    [lineHeight],
  );
  const textStyle = [styles.clock, { fontSize, lineHeight }];

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.clockRow}>
      <LayoutAnimationConfig skipEntering>
        {text.split('').map((char, index) => (
          <View key={index} style={[styles.clockSlot, { height: lineHeight }]}>
            <Text style={[textStyle, styles.clockSizer]}>{char}</Text>
            <Animated.View
              key={char}
              entering={rollIn}
              exiting={rollOut}
              style={styles.clockGlyph}
            >
              <Text style={textStyle}>{char}</Text>
            </Animated.View>
          </View>
        ))}
      </LayoutAnimationConfig>
    </View>
  );
}

interface LengthPillProps {
  minutes: number;
  onLess: () => void;
  onMore: () => void;
}

function LengthPill({ minutes, onLess, onMore }: LengthPillProps) {
  const pop = useSharedValue(1);
  const shown = useRef(minutes);
  useEffect(() => {
    if (shown.current === minutes) return;
    shown.current = minutes;
    pop.value = withSequence(
      withTiming(LENGTH_POP_SCALE, { duration: duration.fast }),
      withTiming(1, { duration: duration.fast }),
    );
  }, [minutes, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View style={styles.pill}>
      <PillStep
        label="−"
        accessibilityLabel="One minute less"
        disabled={minutes <= 1}
        onPress={onLess}
      />
      <Animated.View style={popStyle}>
        <Text style={styles.pillValue}>{`${minutes}m`}</Text>
      </Animated.View>
      <PillStep label="+" accessibilityLabel="One minute more" onPress={onMore} />
    </View>
  );
}

interface PillStepProps {
  label: string;
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: () => void;
}

function PillStep({ label, accessibilityLabel, disabled = false, onPress }: PillStepProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={spacing.sm}
      onPressIn={() => {
        scale.value = withTiming(PILL_PRESS_SCALE, { duration: duration.fast });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: duration.fast });
      }}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
    >
      <Animated.View style={style}>
        <Text style={[styles.pillStep, disabled && styles.pillStepDisabled]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

interface FinishedViewProps {
  player: RoutinePlayerState;
  userId: string | null;
  onDone: () => void;
}

function FinishedView({ player, userId, onDone }: FinishedViewProps) {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const { done, skipped, total, coins: earned, minutes } = routinePlayerSummary(player);
  const celebrating = done > 0;
  // The last tick may still be saving, and the balance only takes its coins
  // once that write lands, so the count waits for a fresh balance rather than
  // counting up from one that is missing them.
  const queryClient = useQueryClient();
  const writing =
    useIsMutating({ mutationKey: ['toggle-self-care-goal', userId] }) > 0;
  const [balanceSettled, setBalanceSettled] = useState(false);
  useEffect(() => {
    if (writing || balanceSettled) return;
    let live = true;
    queryClient
      .refetchQueries({ queryKey: getWalletQueryKey(userId), exact: true })
      .finally(() => {
        if (live) setBalanceSettled(true);
      });
    return () => {
      live = false;
    };
  }, [writing, balanceSettled, queryClient, userId]);
  const coins = balanceSettled ? earned : 0;
  const showMinutes = minutes != null && minutes > 0;
  const coinCard = showMinutes ? 2 : 1;
  const flight = useCoinRewardFlight({ coins, landedAfterMs: rewardCardEnterAt(coinCard) });
  const enterAt = (card: number) => (reducedMotion ? undefined : rewardCardEnterAt(card));
  useCompletionHaptic('activity', celebrating);

  return (
    <View style={styles.finished}>
      <ScrollView
        contentContainerStyle={styles.finishedScroll}
        showsVerticalScrollIndicator={false}
      >
        <ActivityCompletionContent
          title={total === 0 ? 'All clear here' : celebrating ? 'Routine complete!' : 'That’s a wrap'}
          subtitle={
            total === 0
              ? 'Everything in this part of the day is already done.'
              : `${done} of ${total} done${skipped === 0 ? '. Every single one.' : '. Skipped ones stay on your list.'}`
          }
          pose={celebrating ? 'excited' : 'calm'}
        >
          {total === 0 ? null : (
            <View style={[styles.finishedCards, { width: width - padding.screen.horizontal * 2 }]}>
              <HeaderStripStatRow>
                <HeaderStripStatCard
                  label="Done"
                  value={`${done}/${total}`}
                  tone="sky"
                  icon={{ name: 'check', color: colors.playful.sky.mid }}
                  enterAt={enterAt(0)}
                  sparkleRing={celebrating}
                />
                {showMinutes ? (
                  <HeaderStripStatCard
                    label="Minutes"
                    value={`${minutes}`}
                    countTo={minutes}
                    tone="sky"
                    icon={{ name: 'clock', color: colors.playful.sky.mid }}
                    enterAt={enterAt(1)}
                  />
                ) : null}
                <EarnedCoinsCard
                  ref={flight.sourceRef}
                  coins={flight.cardCoins}
                  finalCoins={earned}
                  enterAt={enterAt(coinCard)}
                />
              </HeaderStripStatRow>
              <Land delay={REWARD_BEAT.cta} style={styles.recap}>
                {player.steps.map((goal, index) => {
                  const stepDone = player.outcomes[index] === 'done';
                  return (
                    <View key={goal.id} style={[taskCard.surface, taskCard.face]}>
                      <TaskCardBody
                        icon={<RoutineTaskIcon name={goal.icon} done={stepDone} />}
                        coins={stepDone ? selfCareGoalCoins(goal.recurrence) : undefined}
                      >
                        <Text
                          numberOfLines={TASK_TITLE_MAX_LINES}
                          style={[taskCard.title, !stepDone && styles.recapTitleSkipped]}
                        >
                          {goal.title}
                        </Text>
                        <Text style={taskCard.detail}>{stepDone ? 'Done' : 'Skipped'}</Text>
                      </TaskCardBody>
                      <View style={[styles.recapCheck, stepDone && styles.recapCheckDone]}>
                        {stepDone ? (
                          <Icon bold name="check" size={RECAP_CHECK_ICON_SIZE} color={colors.neutral[0]} />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </Land>
            </View>
          )}
        </ActivityCompletionContent>
      </ScrollView>

      {/* Drawn after the scroll view and floated over it, so nothing paints on
          top of the pill's shine as the coins land in it. */}
      <View style={styles.finishedTopBar} pointerEvents="box-none">
        <View ref={flight.balanceRef} collapsable={false}>
          {balanceSettled ? (
            <EarnedCoinBalance userId={userId} coins={coins} earnedShown={flight.earnedShown} />
          ) : null}
        </View>
      </View>

      <Land delay={REWARD_BEAT.cta} style={styles.finishedFooter}>
        <ChunkyButton shape="card" label="Continue" onPress={onDone} />
      </Land>

      {celebrating && !reducedMotion ? (
        <ConfettiFall count={44} spread={1} startTop={0} fallDistance={height + 80} />
      ) : null}
      <CoinFlightLayer
        ref={flight.flightRef}
        targetRef={flight.balanceRef}
        onReady={flight.onFlightReady}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: padding.screen.horizontal,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  headerGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButtonOn: {
    backgroundColor: colors.primary.blue100,
  },
  headerButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    borderRadius: HEADER_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  pressed: {
    opacity: 0.6,
  },
  body: {
    flex: 1,
    alignItems: 'center',
  },
  titleBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.heavy,
    color: colors.text.primary,
    textAlign: 'center',
  },
  disc: {
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.card,
  },
  clockRow: {
    flexDirection: 'row',
  },
  clockSlot: {
    overflow: 'hidden',
  },
  clockSizer: {
    opacity: 0,
  },
  clockGlyph: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clock: {
    fontFamily: fonts.heavy,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  pillStep: {
    ...typography.body.large,
    color: colors.text.tertiary,
  },
  pillStepDisabled: {
    opacity: 0.4,
  },
  pillValue: {
    ...typography.body.large,
    color: colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3xl'],
    marginTop: spacing.xl,
  },
  sideControl: {
    width: SIDE_ICON_SIZE,
    height: SIDE_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rearrangePill: {
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  rearrangeLabel: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  rearrangeList: {
    gap: spacing.sm,
  },
  rearrangeMoves: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  moveButton: {
    width: MOVE_BUTTON_SIZE,
    height: MOVE_BUTTON_SIZE,
    borderRadius: MOVE_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  nextCard: {
    alignSelf: 'stretch',
    marginTop: 'auto',
  },
  finished: {
    flex: 1,
    marginHorizontal: -padding.screen.horizontal,
  },
  finishedTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: padding.screen.horizontal,
    paddingVertical: spacing.md,
    overflow: 'visible',
  },
  finishedScroll: {
    flexGrow: 1,
    paddingTop: spacing['4xl'],
  },
  finishedCards: {
    gap: spacing.lg,
  },
  recap: {
    gap: spacing.sm,
  },
  recapTitleSkipped: {
    color: colors.text.tertiary,
  },
  recapCheck: {
    width: RECAP_CHECK_SIZE,
    height: RECAP_CHECK_SIZE,
    borderRadius: RECAP_CHECK_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  recapCheckDone: {
    borderColor: colors.success[500],
    backgroundColor: colors.success[500],
  },
  finishedFooter: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.sm,
  },
});
