import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../../app/navigation';
import { loadTourSeen, setTourSeen } from '../../services/preferences/tourSeenPreference';
import { isTourOverlayMounted } from './tourOverlayPresence';
import { useCurrentTourStep, useTourStore } from './tourStore';

const OVERLAY_MOUNT_WATCHDOG_MS = 5000;

/**
 * Runs the post-onboarding tour: starts it once per install and selects the
 * screen that owns each step. Mounted once with the tab navigator.
 */
export function useAppTour() {
  const navigation = useNavigation<RootStackNavigationProp<'MainTabs'>>();
  const step = useCurrentTourStep();
  const stepIndex = useTourStore((state) => state.stepIndex);
  const start = useTourStore((state) => state.start);
  const dismiss = useTourStore((state) => state.dismiss);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    let isActive = true;
    void loadTourSeen().then((seen) => {
      if (!isActive) return;
      // Either way the tour stops being pending, which is what releases the
      // one-time offer and the boot paywall behind it.
      if (seen) dismiss();
      else start();
    });

    return () => {
      isActive = false;
    };
  }, [start, dismiss]);

  useEffect(() => {
    if (step == null) return;
    navigation.navigate('MainTabs', { screen: step.tab });
  }, [step, navigation]);

  useEffect(() => {
    if (step == null || stepIndex == null) return;

    const watchedIndex = stepIndex;
    const id = setTimeout(() => {
      const live = useTourStore.getState();
      if (
        live.stepIndex === watchedIndex &&
        !isTourOverlayMounted(watchedIndex)
      ) {
        live.next();
      }
    }, OVERLAY_MOUNT_WATCHDOG_MS);

    return () => clearTimeout(id);
  }, [step, stepIndex]);
}

/** Dev entry point: clears the seen flag and replays the tour from the top. */
export async function replayAppTour(): Promise<void> {
  await setTourSeen(false);
  useTourStore.getState().start();
}
