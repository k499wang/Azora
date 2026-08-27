import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../../app/navigation';
import { loadTourSeen, setTourSeen } from '../../services/preferences/tourSeenPreference';
import { isTourOverlayMounted } from './tourOverlayPresence';
import { useCurrentTourStep, useTourStore } from './tourStore';

const OVERLAY_MOUNT_WATCHDOG_MS = 5000;

/**
 * Runs the post-onboarding tour: starts it once per install and selects the
 * screen that owns each step. Mounted once by the tab route.
 */
export function useAppTour(enabled: boolean) {
  const navigation = useNavigation<RootStackNavigationProp<'MainTabs'>>();
  const status = useTourStore((state) => state.status);
  const step = useCurrentTourStep();
  const stepIndex = useTourStore((state) => state.stepIndex);
  const start = useTourStore((state) => state.start);
  const dismiss = useTourStore((state) => state.dismiss);
  const [hasResolvedSeenFlag, setHasResolvedSeenFlag] = useState(false);
  const seenFlagReadRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    setHasResolvedSeenFlag(false);
    if (!enabled) {
      seenFlagReadRef.current = null;
      return;
    }

    let isActive = true;
    // StrictMode replays effects without discarding refs. Reuse the pending
    // read so the active replay handles its result without a second storage hit.
    const seenFlagRead = seenFlagReadRef.current ?? loadTourSeen();
    seenFlagReadRef.current = seenFlagRead;
    void seenFlagRead.then((seen) => {
      if (!isActive) return;
      // Either way the tour stops being pending, which is what releases the
      // one-time offer and the boot paywall behind it.
      if (seen) dismiss();
      else start();
      setHasResolvedSeenFlag(true);
    });

    return () => {
      isActive = false;
    };
  }, [dismiss, enabled, start]);

  useEffect(() => {
    if (!enabled || step == null) return;
    navigation.navigate('MainTabs', { screen: step.tab });
  }, [enabled, navigation, step]);

  useEffect(() => {
    if (!enabled || status !== 'closing') return;
    navigation.navigate('MainTabs', { screen: 'Home' });
  }, [enabled, navigation, status]);

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
        live.next();
      }
    }, OVERLAY_MOUNT_WATCHDOG_MS);

    return () => clearTimeout(id);
  }, [enabled, status, step, stepIndex]);

  return hasResolvedSeenFlag;
}

/** Dev entry point: clears the seen flag and replays the tour from the top. */
export async function replayAppTour(): Promise<void> {
  await setTourSeen(false);
  useTourStore.getState().start();
}
