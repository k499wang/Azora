import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../../app/navigation';
import { returnToHome } from '../../app/navigation/returnToHome';
import { loadFirstSessionActivation, loadTourSeen } from '../../services/preferences/tourSeenPreference';
import { isTourOverlayMounted } from './tourOverlayPresence';
import { useCurrentTourStep, useTourStore } from './tourStore';
import {
  activationStopCount,
  useFirstSessionActivationStore,
} from './firstSessionActivationStore';
import { useTourCelebrationStore } from './tourCelebrationStore';
import { useAuthStore } from '../../stores/authStore';
import { formatLocalDate } from '../../lib/calendar/weekCalendarDays';
import { prepareTourDestinations } from './prepareTourDestinations';

const OVERLAY_MOUNT_WATCHDOG_MS = 5000;

/**
 * Runs the post-onboarding tour: starts it once per install and selects the
 * screen that owns each step. Mounted once by the tab route.
 *
 * `enabled` is the app shell's own readiness, not a feature flag. The tour used
 * to begin the moment the saved flag came back, which is a few milliseconds
 * after boot — under the intro splash, on a Home that had not rendered
 * anything yet. The overlay is a native Modal and sits above the splash, so the
 * whole tour could play, and mark itself seen, before the user saw the app.
 */
export function useAppTour(enabled: boolean) {
  const navigation = useNavigation<RootStackNavigationProp<'MainTabs'>>();
  const queryClient = useQueryClient();
  const status = useTourStore((state) => state.status);
  const step = useCurrentTourStep();
  const stepIndex = useTourStore((state) => state.stepIndex);
  const start = useTourStore((state) => state.start);
  const dismiss = useTourStore((state) => state.dismiss);
  const [hasResolvedSeenFlag, setHasResolvedSeenFlag] = useState(false);
  const seenFlagReadRef = useRef<Promise<[boolean, string | null]> | null>(null);
  const seenFlagUserIdRef = useRef<string | null>(null);
  const destinationPreparationRef = useRef<Promise<void> | null>(null);
  const userId = useAuthStore((state) => state.user?.id ?? null);

  useEffect(() => {
    setHasResolvedSeenFlag(false);
    if (!enabled) {
      seenFlagReadRef.current = null;
      return;
    }

    let isActive = true;
    useFirstSessionActivationStore.getState().beginCheck(userId);
    if (seenFlagUserIdRef.current !== userId) {
      seenFlagReadRef.current = null;
      seenFlagUserIdRef.current = userId;
      destinationPreparationRef.current = null;
    }
    // StrictMode replays effects without discarding refs. Reuse the pending
    // read so the active replay handles its result without a second storage hit.
    const seenFlagRead = seenFlagReadRef.current ?? Promise.all([
      loadTourSeen(),
      loadFirstSessionActivation(userId),
    ]);
    seenFlagReadRef.current = seenFlagRead;
    void seenFlagRead.then(async ([seen, activationTechniqueId]) => {
      if (!isActive) return;
      useFirstSessionActivationStore
        .getState()
        .hydrate(userId, activationTechniqueId, seen);
      // Only the pending state acts on the flag. The flag stays false for the
      // whole run, so a remount part-way through — the gate flapping back to
      // booting on a refetch, the intro finishing — would read it again and
      // take the user back to the first stop.
      if (useTourStore.getState().status === 'checking') {
        // Either way the tour stops being pending, which is what releases the
        // one-time offer and the boot paywall behind it.
        if (seen) {
          dismiss();
        } else {
          // The tour changes tabs immediately after it starts. Warm the
          // screens' existing cache entries, but never turn network work into
          // a startup gate: an offline query may remain paused indefinitely.
          const preparation = destinationPreparationRef.current
            ?? prepareTourDestinations(queryClient, userId, formatLocalDate(new Date()));
          destinationPreparationRef.current = preparation;
          void preparation;
          start();
        }
      }
      setHasResolvedSeenFlag(true);
    });

    return () => {
      isActive = false;
    };
  }, [dismiss, enabled, queryClient, start, userId]);

  useEffect(() => {
    if (!enabled || step == null) return;
    if (step.destination.route === 'MainTabs') {
      navigation.navigate('MainTabs', { screen: step.destination.screen });
      return;
    }
    navigation.navigate(step.destination.route);
  }, [enabled, navigation, step]);

  useEffect(() => {
    if (!enabled || status !== 'closing') return;
    returnToHome(navigation);
  }, [enabled, navigation, status]);

  useEffect(() => {
    if (!enabled || status !== 'finished') return;
    useFirstSessionActivationStore.getState().promoteQueued();
    // When activation stops exist they own the confetti; with none, the
    // informational tour's finish is the celebration trigger.
    const { phase, followsTour } = useFirstSessionActivationStore.getState();
    if (activationStopCount(phase, followsTour) > 0) return;
    if (!useTourStore.getState().consumeCompletion()) return;
    useTourCelebrationStore.getState().celebrate();
  }, [enabled, status]);

  useEffect(() => {
    if (!enabled || status !== 'running' || step == null || stepIndex == null) {
      return;
    }

    const watchedIndex = stepIndex;
    const id = setTimeout(() => {
      const live = useTourStore.getState();
      if (
        live.status === 'running' &&
        live.stepIndex === watchedIndex &&
        !isTourOverlayMounted(watchedIndex)
      ) {
        // Nothing is rendering this step, so nothing can place the next one
        // either. Stand the tour down — without marking it seen — so the app
        // is released and it plays properly on the next launch.
        live.abort();
      }
    }, OVERLAY_MOUNT_WATCHDOG_MS);

    return () => clearTimeout(id);
  }, [enabled, status, step, stepIndex]);

  return hasResolvedSeenFlag;
}
