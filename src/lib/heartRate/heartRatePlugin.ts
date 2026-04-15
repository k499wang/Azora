import { VisionCameraProxy, Frame } from 'react-native-vision-camera';
import type { PpgFrameSample } from './types';

const plugin = VisionCameraProxy.initFrameProcessorPlugin('heartRatePlugin', {});

export function heartRatePlugin(frame: Frame): PpgFrameSample | null {
  'worklet';
  if (plugin == null) return null;
  return plugin.call(frame) as unknown as PpgFrameSample | null;
}
