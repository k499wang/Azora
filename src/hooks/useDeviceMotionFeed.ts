import { useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';
import type { HeartRateManager } from '../lib/heartRate/heartRateManager';

const ACCEL_UPDATE_INTERVAL_MS = 40;

// Streams device acceleration only while optical processing is active, giving
// the manager a motion signal that is orthogonal to PPG. Raw Accelerometer needs
// no permission prompt on iOS. Magnitude is in g (~1.0 at rest); the manager
// removes gravity itself.
export function useDeviceMotionFeed(
  managerRef: React.MutableRefObject<HeartRateManager>,
  active: boolean,
): void {
  useEffect(() => {
    if (!active) return;

    Accelerometer.setUpdateInterval(ACCEL_UPDATE_INTERVAL_MS);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      managerRef.current.pushAccelSample(Date.now(), magnitude);
    });

    return () => subscription.remove();
  }, [active, managerRef]);
}
