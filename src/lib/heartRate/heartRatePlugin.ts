import { VisionCameraProxy, Frame } from 'react-native-vision-camera';

const plugin = VisionCameraProxy.initFrameProcessorPlugin('heartRatePlugin', {});

export function heartRatePlugin(frame: Frame): number | null {
  'worklet';
  if (plugin == null) return null;
  return plugin.call(frame) as number | null;
}
