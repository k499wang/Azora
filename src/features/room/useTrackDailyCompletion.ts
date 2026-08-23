import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { posthog } from '../../config/posthog';
import { createSerializedAsync } from '../../lib/serializedAsync';
import { DAILIES_PER_DAY } from '../../lib/dailies';
import { useUserEntitlementQuery } from '../../queries/subscriptions/useUserEntitlementQuery';
import { useHomeStatsQuery } from '../../queries/tracking/useHomeStatsQuery';
import { AnalyticsEvent } from '../../services/analytics/events';
import { trackRoomRewardUnlocked } from '../../services/analytics/room';
import { useAuthStore } from '../../stores/authStore';
import type { DailyCompleteSnapshot } from './useDailyCompleteSnapshot';
import type { RoomClaim } from './useRoomClaim';

const TRACKED_KEY_PREFIX = 'analytics.daily_completion_tracked';

interface TrackedDay {
  localDate: string;
  completed: boolean;
  unlocked: boolean;
}

interface DailyEventClaims {
  completed: boolean;
  unlocked: boolean;
}

const claimQueue = createSerializedAsync();
const trackedByUser = new Map<string, TrackedDay>();
const loadedUsers = new Set<string>();

function trackedKey(userId: string): string {
  return `${TRACKED_KEY_PREFIX}:${userId}`;
}

/** Claim both daily events in one serialized, per-user read-modify-write. */
function claimDailyEvents(
  userId: string,
  localDate: string,
  requested: DailyEventClaims,
): Promise<DailyEventClaims> {
  return claimQueue.run(async () => {
    if (!loadedUsers.has(userId)) {
      try {
        const raw = await AsyncStorage.getItem(trackedKey(userId));
        if (raw != null) {
          trackedByUser.set(userId, JSON.parse(raw) as TrackedDay);
        }
      } catch {
        trackedByUser.delete(userId);
      }
      loadedUsers.add(userId);
    }

    const stored = trackedByUser.get(userId);
    const current =
      stored?.localDate === localDate
        ? stored
        : { localDate, completed: false, unlocked: false };
    const claimed = {
      completed: requested.completed && !current.completed,
      unlocked: requested.unlocked && !current.unlocked,
    };

    if (!claimed.completed && !claimed.unlocked) return claimed;

    const next = {
      ...current,
      completed: current.completed || claimed.completed,
      unlocked: current.unlocked || claimed.unlocked,
    };
    trackedByUser.set(userId, next);

    try {
      await AsyncStorage.setItem(trackedKey(userId), JSON.stringify(next));
    } catch {
      // Fail open: analytics storage must never affect the completion flow.
    }

    return claimed;
  });
}

/**
 * Track the two distinct outcomes at the end of a daily completion.
 *
 * One effect snapshots the settled query values, then claims both events in a
 * single persisted operation. The detached work never delays the result UI.
 */
export function useTrackDailyCompletion(
  snapshot: DailyCompleteSnapshot | null,
  claim: RoomClaim,
) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const mountedUserId = useRef(userId).current;
  const trackingStartedRef = useRef(false);
  const entitlementQuery = useUserEntitlementQuery(userId);
  const homeStatsQuery = useHomeStatsQuery(
    userId,
    snapshot?.todayLocalDate ?? claim.dailies.todayLocalDate,
  );

  const earnedDate = snapshot?.todayLocalDate ?? null;
  const allDone = snapshot != null && snapshot.state.done >= DAILIES_PER_DAY;
  const unlocked = snapshot?.state.unlocked === true;

  useEffect(() => {
    if (
      trackingStartedRef.current ||
      !allDone ||
      earnedDate == null ||
      mountedUserId == null ||
      userId !== mountedUserId ||
      claim.isLoading ||
      (!entitlementQuery.isSuccess && !entitlementQuery.isError) ||
      entitlementQuery.isFetching ||
      (!homeStatsQuery.isSuccess && !homeStatsQuery.isError) ||
      homeStatsQuery.isFetching
    ) {
      return;
    }

    trackingStartedRef.current = true;

    const isPro = entitlementQuery.isSuccess
      ? entitlementQuery.data?.isPro === true
      : null;
    const completedProperties = {
      is_pro: isPro,
      streak_days: homeStatsQuery.isSuccess
        ? homeStatsQuery.data?.streak?.currentStreak ?? null
        : null,
      room_piece_earned: unlocked,
      floor: claim.room?.floor ?? null,
    };
    const rewardProperties = {
      isPro,
      floor: claim.room?.floor ?? null,
      slot: snapshot?.state.nextSlot ?? null,
      placedCount: claim.progress.placedCount,
    };

    void claimDailyEvents(mountedUserId, earnedDate, {
      completed: true,
      unlocked: unlocked && rewardProperties.floor != null,
    }).then((claimed) => {
      if (useAuthStore.getState().user?.id !== mountedUserId) return;

      if (claimed.completed) {
        posthog.capture(
          AnalyticsEvent.DailiesCompleted,
          completedProperties,
        );
      }
      if (claimed.unlocked && rewardProperties.floor != null) {
        trackRoomRewardUnlocked({
          ...rewardProperties,
          floor: rewardProperties.floor,
        });
      }
    });
  }, [
    allDone,
    claim.isLoading,
    claim.progress.placedCount,
    claim.room?.floor,
    earnedDate,
    entitlementQuery.data?.isPro,
    entitlementQuery.isError,
    entitlementQuery.isFetching,
    entitlementQuery.isSuccess,
    homeStatsQuery.data?.streak?.currentStreak,
    homeStatsQuery.isError,
    homeStatsQuery.isFetching,
    homeStatsQuery.isSuccess,
    mountedUserId,
    snapshot?.state.nextSlot,
    unlocked,
    userId,
  ]);
}
