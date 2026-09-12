import { useCallback, useEffect, useMemo, useState } from 'react';
import { REWARD_FLOW_BEATS, type RewardRoomBox } from './DailyRewardFlow';
import { isRoomOverridden, placeInOverride } from './devRoomOverride';
import { usePlaceDecorationMutation } from '../../queries/room/usePlaceDecorationMutation';
import { ROOM_SLOT_COUNT } from '../../lib/room/roomProgress';
import type { RoomClaim } from './useRoomClaim';

/**
 * Opening the day's piece, wherever the day was finished.
 *
 * Three screens can be the last thing standing between a user and the
 * decoration — Home when the final to-do is ticked, and either result screen
 * when the final session ends — and all three used to answer differently: Home
 * opened the flow in place, the result screens replaced themselves with a whole
 * separate screen. Same reward, two experiences, and only one of them got the
 * fixes. This is the one answer all three call.
 *
 * The sheet stays with each screen. Only the stage is shared, because only the
 * stage was duplicated.
 */
export function useDailyRewardStage({
  userId,
  claim,
  todayLocalDate,
}: {
  userId: string | null;
  claim: RoomClaim;
  /** the day the piece is earned for, as the user's calendar sees it */
  todayLocalDate: string;
}): {
  decorating: boolean;
  /**
   * The celebration stays drawn a moment longer, behind the stage's field as
   * it closes over it. Both are content of one `DailyRewardSurface`, so this is
   * two views cross-fading — the handover can overlap without either of them
   * being a presentation the other can tear down.
   */
  handingOver: boolean;
  /**
   * The room is full and the seal is playing.
   *
   * A phase of the same surface, never a screen. The seventh piece, the week
   * replayed and the choice of the next room are one moment, and a navigation
   * in the middle of it is the one thing that breaks it. It waits for the write
   * because the replay cannot be handed a room one decoration short.
   */
  sealing: boolean;
  /** where the stage left the room, so the seal can carry on from there */
  sealFrom: RewardRoomBox | null;
  /** the ending, without the day that earns it — the lab's way in */
  startSeal: () => void;
  setSealFrom: (box: RewardRoomBox) => void;
  endSeal: () => void;
  /**
   * `handOver` when a celebration is on screen for this to take over from.
   * Opening cold — the card on Home, days later — has nothing to fade out of,
   * and holding a sheet that was never up flashes a celebration at someone who
   * has not just finished anything.
   */
  open: (options?: { handOver?: boolean }) => void;
  close: () => void;
  place: (optionId: string) => void;
} {
  const [decorating, setDecorating] = useState(false);
  const [handingOver, setHandingOver] = useState(false);
  const [sealing, setSealing] = useState(false);
  const [sealFrom, setSealFrom] = useState<RewardRoomBox | null>(null);

  const close = useCallback(() => {
    setDecorating(false);
    setHandingOver(false);
  }, []);

  useEffect(() => {
    if (!handingOver) return;

    const timer = setTimeout(
      () => setHandingOver(false),
      REWARD_FLOW_BEATS.cover + 80,
    );
    return () => clearTimeout(timer);
  }, [handingOver]);

  const placeDecoration = usePlaceDecorationMutation(userId);

  /** The stage gives the surface over to the seal, which is drawn on it too. */
  const seal = useCallback(() => {
    setDecorating(false);
    setHandingOver(false);
    setSealing(true);
  }, []);

  const place = useCallback(
    (optionId: string) => {
      const slot = claim.progress.nextSlot;
      if (slot == null || !claim.progress.canClaim) return;

      const completesRoom = claim.progress.placedCount === ROOM_SLOT_COUNT - 1;

      // The dev lab hands these screens a fabricated room. Nothing real is
      // written; the piece goes into the fiction instead, so the rest of the
      // day — the seal included — has a room that actually gained it.
      if (isRoomOverridden()) {
        placeInOverride(slot, optionId, todayLocalDate);
        if (completesRoom) seal();
        return;
      }

      placeDecoration.mutate(
        { slot, optionId, earnedLocalDate: todayLocalDate },
        {
          onSuccess: () => {
            if (completesRoom) seal();
          },
          // The piece has already fallen and the rail has already gone, so
          // there is nothing left on the stage to try again with. Letting go of
          // it puts the user back where the day's piece is still offered,
          // rather than on a surface with no way out of it.
          onError: close,
        },
      );
    },
    [
      close,
      claim.progress.canClaim,
      claim.progress.nextSlot,
      claim.progress.placedCount,
      placeDecoration,
      seal,
      todayLocalDate,
    ],
  );

  const endSeal = useCallback(() => {
    setSealing(false);
    setSealFrom(null);
  }, []);

  const open = useCallback((options?: { handOver?: boolean }) => {
    setDecorating(true);
    setHandingOver(options?.handOver === true);
  }, []);

  // One object per state change, not one per render. Screens put this in effect
  // dependencies, and a fresh identity every render turns "when the stage
  // opens" into "on every render", which is how an effect that opens something
  // reopens it the moment the user closes it.
  return useMemo(
    () => ({
      decorating,
      handingOver,
      sealing,
      sealFrom,
      setSealFrom,
      startSeal: seal,
      endSeal,
      open,
      close,
      place,
    }),
    [
      close,
      decorating,
      endSeal,
      handingOver,
      open,
      place,
      seal,
      sealFrom,
      sealing,
    ],
  );
}
