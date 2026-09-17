import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import ConfettiFall from '../../components/common/ConfettiFall';
import { TOUR_CELEBRATION_MS, useTourCelebrationStore } from './tourCelebrationStore';

/**
 * The confetti that lands the moment the run hands the app back. Mounted above
 * the navigator so it falls over whatever screen the user was returned to.
 */
export default function TourCelebration() {
  const celebrating = useTourCelebrationStore((state) => state.celebrating);
  const clear = useTourCelebrationStore((state) => state.clear);
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!celebrating) return;
    if (reducedMotion) {
      clear();
      return;
    }
    const id = setTimeout(clear, TOUR_CELEBRATION_MS);
    return () => clearTimeout(id);
  }, [celebrating, clear, reducedMotion]);

  if (!celebrating || reducedMotion) return null;

  return (
    <ConfettiFall
      count={44}
      spread={1}
      startTop={0}
      fallDistance={height + 80}
    />
  );
}
