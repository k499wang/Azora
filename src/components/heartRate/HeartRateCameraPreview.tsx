import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import type {
  CameraDevice,
  CameraDeviceFormat,
  ReadonlyFrameProcessor,
} from 'react-native-vision-camera';

export interface HeartRateCameraPreviewProps {
  device: CameraDevice;
  format?: CameraDeviceFormat;
  frameProcessor?: ReadonlyFrameProcessor;
  torchMode?: 'on' | 'off';
  isActive?: boolean;
}

export const HeartRateCameraPreview = memo(function HeartRateCameraPreview({
  device,
  format,
  frameProcessor,
  torchMode = 'off',
  isActive = true,
}: HeartRateCameraPreviewProps) {
  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      format={format}
      isActive={isActive}
      torch={device.hasTorch ? torchMode : 'off'}
      pixelFormat="rgb"
      fps={30}
      frameProcessor={frameProcessor}
    />
  );
});
