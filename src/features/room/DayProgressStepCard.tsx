import { useEffect, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import { RoomProgressCardView, type RoomCardView } from './RoomProgressCard';
import {
  buildDailyCompleteSnapshot,
  type DailyCompletionProjection,
} from './useDailyCompleteSnapshot';
import { useRoomClaim, type RoomClaim } from './useRoomClaim';

interface DayProgressStep {
  done: number;
  total: number;
  /** this step finished the day and its piece is waiting */
  earned: boolean;
}

interface Props {
  userId: string | null;
  /** the plan activity just finished; absent when it counted for nothing */
  counted: DailyCompletionProjection | undefined;
  /** when the bar starts filling */
  fillDelay: number;
  reducedMotion: boolean;
  style?: ViewStyle;
}

const noAction = () => {};

/**
 * Today's bar on a result screen, filling the one step the activity just earned.
 *
 * The same card Home shows, so the bar people watch fill here is the one they
 * find there afterwards. Nothing shows when the activity was not part of
 * today's plan, or there is no piece left to earn today: a bar that fills for
 * something that did not count would be a number flattering them.
 */
export default function DayProgressStepCard({
  userId,
  counted,
  fillDelay,
  reducedMotion,
  style,
}: Props) {
  const step = useDayProgressStep(userId, counted);
  if (step == null) return null;

  return (
    <View style={style}>
      <RoomProgressCardView
        view={describeDayProgressStep(step)}
        onAction={noAction}
        fill={
          reducedMotion
            ? undefined
            : { from: Math.max(0, step.done - 1) / step.total, delay: fillDelay }
        }
      />
    </View>
  );
}

/** Frozen at first sight, so a refetch landing mid-fill cannot move the bar. */
function useDayProgressStep(
  userId: string | null,
  counted: DailyCompletionProjection | undefined,
): DayProgressStep | null {
  const claim = useRoomClaim(userId);
  const [step, setStep] = useState<DayProgressStep | null | undefined>(undefined);

  useEffect(() => {
    if (step !== undefined || claim.isLoading) return;
    setStep(dayProgressStep(claim, counted));
  }, [claim, counted, step]);

  return step ?? null;
}

function dayProgressStep(
  claim: RoomClaim,
  counted: DailyCompletionProjection | undefined,
): DayProgressStep | null {
  if (counted == null) return null;
  const inToday = claim.dailies.units.some(
    (unit) =>
      (counted.unitId != null && unit.id === counted.unitId) ||
      (counted.techniqueId != null && unit.techniqueId === counted.techniqueId),
  );
  if (!inToday) return null;

  // Projected, because the save behind this screen may not have landed yet.
  const { state } = buildDailyCompleteSnapshot(claim, null, counted);
  if (!state.showBar || state.total === 0) return null;
  if (state.done >= state.total && !state.unlocked) return null;
  return { done: state.done, total: state.total, earned: state.unlocked };
}

function describeDayProgressStep({ done, total, earned }: DayProgressStep): RoomCardView {
  if (earned) {
    return { title: 'You earned today’s decoration!', tone: 'ready', done, total, action: null };
  }
  return {
    title: `${total - done} more to earn today’s decoration`,
    tone: 'waiting',
    done,
    total,
    action: null,
  };
}
