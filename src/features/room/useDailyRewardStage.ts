import { useCallback, useState } from 'react';
import { isRoomOverridden } from './devRoomOverride';
import { usePlaceDecorationMutation } from '../../queries/room/usePlaceDecorationMutation';
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
  open: () => void;
  close: () => void;
  place: (optionId: string) => void;
} {
  const [decorating, setDecorating] = useState(false);
  const placeDecoration = usePlaceDecorationMutation(userId);

  const place = useCallback(
    (optionId: string) => {
      const slot = claim.progress.nextSlot;
      if (slot == null || !claim.progress.canClaim) return;

      // The dev lab hands these screens a fabricated room. Playing the landing
      // is the point there; writing a decoration against invented state is not.
      if (isRoomOverridden()) return;

      placeDecoration.mutate({ slot, optionId, earnedLocalDate: todayLocalDate });
    },
    [
      claim.progress.canClaim,
      claim.progress.nextSlot,
      placeDecoration,
      todayLocalDate,
    ],
  );

  return {
    decorating,
    open: useCallback(() => setDecorating(true), []),
    close: useCallback(() => setDecorating(false), []),
    place,
  };
}
