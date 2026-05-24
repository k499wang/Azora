import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Accelerometer } from 'expo-sensors';
import { makeMutable } from 'react-native-reanimated';

const UPDATE_INTERVAL_MS = 33;
const SENSOR_SMOOTHING = 0.12;

const tiltX = makeMutable(0);
const tiltY = makeMutable(0);

let activeConsumers = 0;
let subscription: { remove: () => void } | null = null;

function clampTilt(value: number) {
  return Math.max(-1, Math.min(1, value));
}

function startTiltSource() {
  if (subscription) return;

  Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
  subscription = Accelerometer.addListener(({ x, y }) => {
    const targetX = clampTilt(x);
    const targetY = clampTilt(-y);

    tiltX.value = tiltX.value + (targetX - tiltX.value) * SENSOR_SMOOTHING;
    tiltY.value = tiltY.value + (targetY - tiltY.value) * SENSOR_SMOOTHING;
  });
}

function stopTiltSourceIfIdle() {
  if (activeConsumers > 0) return;

  subscription?.remove();
  subscription = null;
}

export function useDeviceTilt() {
  useFocusEffect(
    useCallback(() => {
      activeConsumers += 1;
      startTiltSource();

      return () => {
        activeConsumers = Math.max(0, activeConsumers - 1);
        stopTiltSourceIfIdle();
      };
    }, []),
  );

  return { x: tiltX, y: tiltY };
}
