import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { useHeartRateStream } from '../../hooks/useHeartRateStream';
import { CameraCheckScreen } from './CameraCheckScreen';
import { LiveBPMBadge } from './LiveBPMBadge';
import type { HeartRateStreamSummary } from '../../lib/heartRate/types';

interface HeartRateOverlayProps {
  onStreamStopped?: (summary: HeartRateStreamSummary) => void;
  onClose: () => void;
}

export function HeartRateOverlay({ onStreamStopped, onClose }: HeartRateOverlayProps) {
  const {
    streamState,
    fingerPlacement,
    currentBpm,
    sessionSummary,
    device,
    frameProcessor,
    torchMode,
    startStream,
    startStreaming,
    stopStream,
    hasPermission,
    requestPermission,
  } = useHeartRateStream();

  const hasStarted = useRef(false);
  const hasFinished = useRef(false);

  // Auto-start stream on mount
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      void (async () => {
        if (!hasPermission) {
          const granted = await requestPermission();
          if (!granted) {
            hasFinished.current = true;
            onClose();
            return;
          }
        }
        startStream();
      })();
    }
  }, [hasPermission, onClose, requestPermission, startStream]);

  // Handle stopped state
  useEffect(() => {
    if (streamState === 'stopped' && !hasFinished.current) {
      hasFinished.current = true;
      if (sessionSummary != null && onStreamStopped != null) {
        onStreamStopped(sessionSummary);
      }
      onClose();
    }
  }, [streamState, sessionSummary, onStreamStopped, onClose]);

  const showModal =
    streamState === 'idle' || streamState === 'camera_check';

  const showBadge =
    streamState === 'warming_up' ||
    streamState === 'streaming' ||
    streamState === 'finger_lost';

  const handleStartAnyway = useCallback(() => {
    startStreaming();
  }, [startStreaming]);

  const handleCancelSetup = useCallback(() => {
    hasFinished.current = true;
    stopStream();
    onClose();
  }, [stopStream, onClose]);

  const cameraActive = streamState !== 'idle' && streamState !== 'stopped';

  const camera = device != null && cameraActive ? (
    <Camera
      style={styles.hiddenCamera}
      device={device}
      isActive={true}
      torch={torchMode}
      pixelFormat="rgb"
      fps={30}
      frameProcessor={frameProcessor}
    />
  ) : null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Hidden camera — always mounted during active session */}
      {!showModal && camera}

      {/* Full-screen modal for camera check */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCancelSetup}
      >
        <View style={styles.flex}>
          {camera}
          <CameraCheckScreen
            fingerPlacement={fingerPlacement}
            onStartAnyway={handleStartAnyway}
            onCancel={handleCancelSetup}
            timeoutSeconds={10}
          />
        </View>
      </Modal>

      {/* Live BPM badge overlay */}
      {showBadge && (
        <View style={styles.badgeContainer} pointerEvents="box-none">
          <LiveBPMBadge
            bpm={currentBpm}
            streamState={streamState}
            onStop={stopStream}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  flex: {
    flex: 1,
  },
  hiddenCamera: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  badgeContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 101,
  },
});
