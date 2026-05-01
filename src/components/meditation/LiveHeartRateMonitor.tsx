import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { useLivePulse } from '../../hooks/useLivePulse';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Props = Pick<
  ReturnType<typeof useLivePulse>,
  | 'active'
  | 'fingerPlacement'
  | 'currentBpm'
  | 'beatTick'
  | 'device'
  | 'format'
  | 'frameProcessor'
  | 'torchMode'
> & {
  mountCamera?: boolean;
};

export function LiveHeartRateMonitor({
  active,
  fingerPlacement,
  currentBpm,
  beatTick,
  device,
  format,
  frameProcessor,
  torchMode,
  mountCamera = true,
}: Props) {
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (beatTick <= 0) return;
    pulseScale.setValue(1);
    Animated.sequence([
      Animated.timing(pulseScale, { toValue: 1.25, duration: 90, useNativeDriver: true }),
      Animated.timing(pulseScale, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [beatTick, pulseScale]);

  if (!active) return null;

  const hasFinger = fingerPlacement === 'good' || fingerPlacement === 'partial';
  const showBpm = hasFinger && currentBpm != null;

  return (
    <View style={styles.container}>
      {/* Camera must be mounted and isActive for the frame processor to run.
          When mountCamera is false, the parent owns a persistent Camera. */}
      {mountCamera && device != null ? (
        <View style={styles.preview}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            format={format}
            isActive={true}
            torch={torchMode}
            pixelFormat="rgb"
            fps={30}
            frameProcessor={frameProcessor}
          />
        </View>
      ) : null}

      <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
        <MaterialCommunityIcons
          name="heart"
          size={14}
          color={showBpm ? colors.error[500] : colors.text.tertiary}
        />
      </Animated.View>

      {showBpm ? (
        <>
          <Text style={styles.bpm}>{currentBpm}</Text>
          <Text style={styles.unit}>bpm</Text>
        </>
      ) : (
        <Text style={styles.prompt}>
          {fingerPlacement === 'lost'
            ? 'Signal lost - hold steady'
            : 'Place finger on rear camera'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.background.elevated,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  preview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginRight: spacing.xs,
  },
  bpm: {
    ...typography.body.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  unit: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
  prompt: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
  },
});
