import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { useDeviceTilt } from './useDeviceTilt';

const FRAME_SMOOTHING = 0.32;

export function useTiltRoll() {
  const tilt = useDeviceTilt();
  const roll = useSharedValue(0);

  const frame = useFrameCallback(() => {
    roll.value = roll.value + (tilt.x.value - roll.value) * FRAME_SMOOTHING;
  }, false);

  useFocusEffect(
    useCallback(() => {
      frame.setActive(true);
      return () => frame.setActive(false);
    }, [frame]),
  );

  return roll;
}
