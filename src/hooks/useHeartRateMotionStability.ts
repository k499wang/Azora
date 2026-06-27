import { useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';
import {
  createMotionStabilityTracker,
  type MotionStabilityResult,
  type MotionStabilityState,
} from '../lib/heartRate/motionStability';

const UPDATE_INTERVAL_MS = 33;

const STABLE_RESULT: MotionStabilityResult = {
  state: 'stable',
  score: 0,
};

export function useHeartRateMotionStability(active: boolean): MotionStabilityResult {
  const [motion, setMotion] = useState<MotionStabilityResult>(STABLE_RESULT);
  const trackerRef = useRef(createMotionStabilityTracker());
  const lastStateRef = useRef<MotionStabilityState>('stable');

  useEffect(() => {
    if (!active) {
      trackerRef.current.reset();
      lastStateRef.current = 'stable';
      setMotion(STABLE_RESULT);
      return undefined;
    }

    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const next = trackerRef.current.update({
        timestamp: Date.now(),
        x,
        y,
        z,
      });

      if (next.state !== lastStateRef.current) {
        lastStateRef.current = next.state;
        setMotion(next);
      }
    });

    return () => {
      subscription.remove();
      trackerRef.current.reset();
      lastStateRef.current = 'stable';
    };
  }, [active]);

  return motion;
}
