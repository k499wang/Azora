import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimerKeepAwake } from '../features/selfCare/shared/useTimerKeepAwake';
import { useIsFocused } from '@react-navigation/native';
import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import { useReducedMotion } from 'react-native-reanimated';
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
import { Text } from '../components/common/Text';
import Icon from '../components/common/icons/Icon';
import TaskTimer from '../features/selfCare/shared/TaskTimer';
import PlayerHeaderControls from '../features/selfCare/shared/PlayerHeaderControls';
import RearrangeSheet, { RearrangePill } from '../features/selfCare/shared/RearrangeSheet';
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
  routineStepMinutes,
  routineTimeOfDay,
  type RoutinePlayerAction,
  type RoutinePlayerState,
} from '../features/selfCare/domain/routinePlayer';
import { useFirstWinOfDay } from '../features/selfCare/useFirstWinOfDay';
import { useFirstWinOfDayStore } from '../features/selfCare/firstWinOfDayStore';
import { useRoutineStepTimer } from '../features/selfCare/useRoutineStepTimer';
import { speakRoutineLine, stopRoutineVoice } from '../features/selfCare/routineVoice';
import { useTaskTimerAlert } from '../features/selfCare/shared/useTaskTimerAlert';
import { useAudioPreferences } from '../features/audioSettings';
import TaskCardBody, {
  taskCard,
  TASK_TITLE_MAX_LINES,
} from '../components/home/journey/TaskCardBody';
import ActivityCompletionContent from '../features/plan/ActivityCompletionContent';
import RoutineTaskIcon from '../features/selfCare/RoutineTaskIcon';
import { selfCareGoalCoins } from '../features/selfCare/domain/selfCareGoal';
import { REWARD_BEAT, rewardCardEnterAt } from '../features/plan/rewardEntrance';
import { useCoinRewardFlight } from '../hooks/useCoinRewardFlight';
import { useCompletionHaptic } from '../hooks/useCompletionHaptic';
import { useWhileVisible } from '../hooks/useWhileVisible';
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
import { colors } from '../theme/colors';
import { duration } from '../theme/motion';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const HEADER_BUTTON_SIZE = 40;
const HEADER_ICON_SIZE = 18;
const RECAP_CHECK_SIZE = 24;
const RECAP_CHECK_ICON_SIZE = 15;

export default function RoutinePlayerScreen({
  navigation,
  route,
}: RoutinePlayerScreenProps) {
  useTimerKeepAwake('routine-player');
  const focused = useIsFocused();
  const { goalIds } = route.params;
  const insets = useSafeAreaInsets();
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
    if (voiceOnRef.current && navigation.isFocused() && AppState.currentState === 'active') {
      speakRoutineLine(line);
    }
  }, [navigation]);
  useWhileVisible(() => () => stopRoutineVoice(), []);

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
  const remainingCount = player == null ? 0 : Math.max(0, player.steps.length - player.index);
  const stepKey = step == null ? 'none' : `${player?.index}:${step.id}`;
  useEffect(() => setPaused(false), [stepKey]);

  const timer = useRoutineStepTimer({
    active: step != null && focused,
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

  useTaskTimerAlert({
    kind: 'routine',
    title: step?.title ?? null,
    nextTitle: next?.title ?? null,
    seconds: timer.seconds,
    active: step != null && durationMs != null && !paused,
  });

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
        <PlayerHeaderControls
          voiceOn={voiceOn}
          autoAdvance={autoAdvance}
          onToggleVoice={() => {
            if (voiceOn) stopRoutineVoice();
            setRoutineVoice(!voiceOn);
          }}
          onToggleAutoAdvance={() => setRoutineAutoAdvance(!autoAdvance)}
        />
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
          <TaskTimer
            title={step.title}
            icon={step.icon}
            stepKey={stepKey}
            timer={timer}
            minutes={minutes}
            paused={paused}
            onTogglePause={() => setPaused((current) => !current)}
            onLess={() => dispatch({ type: 'removeMinute' })}
            onMore={() => dispatch({ type: 'addMinute' })}
            onDone={complete}
            onSkip={skip}
          />

          <View style={styles.nextBlock}>
            {remainingCount < 2 ? null : <RearrangePill onPress={() => setRearranging(true)} />}
            <View style={[taskCard.surface, taskCard.face]}>
              <TaskCardBody
                icon={<RoutineTaskIcon name={next == null ? 'celebration' : next.icon} />}
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
        </View>
      )}

      <RearrangeSheet
        visible={rearranging && remainingCount >= 2}
        onClose={() => setRearranging(false)}
        items={player == null ? [] : player.steps.slice(player.index).map((goal, offset) => {
          const length = routineStepMinutes(player, player.index + offset);
          return {
            key: goal.id,
            title: goal.title,
            icon: goal.icon,
            detail: length == null ? 'No timer' : `${length} min`,
          };
        })}
        onMove={(offset, direction) => {
          if (player == null) return;
          const at = player.index + offset;
          dispatch({ type: 'moveUpcoming', from: at, to: at + direction });
        }}
      />
    </View>
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
  nextBlock: {
    alignSelf: 'stretch',
    marginTop: 'auto',
    gap: spacing.sm,
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
