import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import type {
  CameraDevice,
  CameraDeviceFormat,
  ReadonlyFrameProcessor,
} from 'react-native-vision-camera';
import type { FingerPlacementState } from '../../lib/heartRate/types';
import { useHeartRateCameraControls } from '../../hooks/useHeartRateCameraControls';

export interface HeartRateCameraPreviewProps {
  device: CameraDevice;
  format?: CameraDeviceFormat;
  frameProcessor?: ReadonlyFrameProcessor;
  torchMode?: 'on' | 'off';
  fingerPlacement?: FingerPlacementState;
  isActive?: boolean;
}

export const HeartRateCameraPreview = memo(function HeartRateCameraPreview({
  device,
  format,
  frameProcessor,
  torchMode = 'off',
  fingerPlacement,
  isActive = true,
}: HeartRateCameraPreviewProps) {
  useHeartRateCameraControls({
    device,
    isActive,
    torchMode,
    fingerPlacement,
  });

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      format={format}
      isActive={isActive}
      torch={device.hasTorch ? torchMode : 'off'}
      pixelFormat="rgb"
      fps={30}
      videoStabilizationMode="off"
      frameProcessor={frameProcessor}
    />
  );
});
