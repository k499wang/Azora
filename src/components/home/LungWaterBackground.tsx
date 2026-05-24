import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Canvas,
  Group,
  Path,
  Skia,
  rrect,
  rect as skRect,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { useTiltRoll } from '../../hooks/useTiltRoll';

const CARD_RADIUS = 22;
const MAX_TILT_RAD = 1.1;
const WAVE_SEGMENTS = 28;

const BACK_AMPLITUDE = 10;
const BACK_WAVELENGTH = 130;
const BACK_SPEED = 0.0018;
const BACK_OPACITY = 0.2;

const FRONT_AMPLITUDE = 7;
const FRONT_WAVELENGTH = 190;
const FRONT_SPEED = -0.0024;
const FRONT_OPACITY = 0.3;

interface Props {
  fillLevel: number;
}

export default function LungWaterBackground({ fillLevel }: Props) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const roll = useTiltRoll();
  const clock = useSharedValue(0);

  const frame = useFrameCallback((info) => {
    clock.value = info.timestamp;
  }, false);

  useFocusEffect(
    useCallback(() => {
      frame.setActive(true);
      return () => frame.setActive(false);
    }, [frame]),
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (size && size.w === width && size.h === height) return;
    setSize({ w: width, h: height });
  };

  const clipPath = useMemo(() => {
    if (!size) return null;
    return rrect(skRect(0, 0, size.w, size.h), CARD_RADIUS, CARD_RADIUS);
  }, [size]);

  const baseFillY = useMemo(() => {
    if (!size) return 0;
    const clamped = Math.max(0.1, Math.min(0.85, fillLevel));
    return size.h - clamped * size.h;
  }, [size, fillLevel]);

  const slope = useDerivedValue(() => -Math.tan(roll.value * MAX_TILT_RAD));

  const buildWavePath = (
    width: number,
    height: number,
    amplitude: number,
    wavelength: number,
    phase: number,
    slopeVal: number,
    baseY: number,
  ) => {
    'worklet';
    const path = Skia.Path.Make();
    const cx = width / 2;
    const k = (Math.PI * 2) / wavelength;
    const step = width / WAVE_SEGMENTS;

    let prevX = 0;
    let prevY = baseY + (prevX - cx) * slopeVal + amplitude * Math.sin(k * prevX + phase);
    path.moveTo(prevX, prevY);
    for (let i = 1; i <= WAVE_SEGMENTS; i++) {
      const x = i * step;
      const y = baseY + (x - cx) * slopeVal + amplitude * Math.sin(k * x + phase);
      const midX = (prevX + x) / 2;
      const midY = (prevY + y) / 2;
      path.quadTo(prevX, prevY, midX, midY);
      prevX = x;
      prevY = y;
    }
    path.lineTo(width, prevY);
    path.lineTo(width, height);
    path.lineTo(0, height);
    path.close();
    return path;
  };

  const backPath = useDerivedValue(() => {
    if (!size) return Skia.Path.Make();
    return buildWavePath(
      size.w,
      size.h,
      BACK_AMPLITUDE,
      BACK_WAVELENGTH,
      clock.value * BACK_SPEED,
      slope.value,
      baseFillY,
    );
  });

  const frontPath = useDerivedValue(() => {
    if (!size) return Skia.Path.Make();
    return buildWavePath(
      size.w,
      size.h,
      FRONT_AMPLITUDE,
      FRONT_WAVELENGTH,
      clock.value * FRONT_SPEED,
      slope.value,
      baseFillY + 2,
    );
  });

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={onLayout}
    >
      {size && clipPath && (
        <Canvas style={{ width: size.w, height: size.h }}>
          <Group clip={clipPath}>
            <Path path={backPath} color={colors.primary.blue300} opacity={BACK_OPACITY} />
            <Path path={frontPath} color={colors.primary.blue400} opacity={FRONT_OPACITY} />
          </Group>
        </Canvas>
      )}
    </View>
  );
}
