import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  type DimensionValue,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';

const CONFETTI_COLORS = [
  colors.primary.blue400,
  colors.primary.blue600,
  colors.success[500],
  colors.orange[400],
  colors.orange[500],
  colors.primary.blue300,
];

interface ConfettiPieceConfig {
  xPercent: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  rotation: number;
  size: number;
}

function buildConfetti(count: number, spread: number): ConfettiPieceConfig[] {
  const margin = (100 - spread * 100) / 2;
  return Array.from({ length: count }, (_, i) => ({
    xPercent: margin + Math.random() * spread * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 400,
    duration: 3000 + Math.random() * 2200,
    drift: (Math.random() - 0.5) * 280,
    rotation: (Math.random() > 0.5 ? 1 : -1) * (200 + Math.random() * 400),
    size: 6 + Math.random() * 6,
  }));
}

function ConfettiPiece({
  xPercent,
  color,
  delay,
  duration,
  drift,
  rotation,
  size,
  fallDistance,
  startTop,
}: ConfettiPieceConfig & { fallDistance: number; startTop: DimensionValue }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fall = Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    fall.start();
    return () => fall.stop();
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, fallDistance],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drift],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${rotation}deg`],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          top: startTop,
          left: `${xPercent}%`,
          width: size,
          height: size * 0.65,
          borderRadius: size * 0.15,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    />
  );
}

interface ConfettiFallProps {
  count?: number;
  fallDistance?: number;
  /** Fraction of the screen width the pieces spawn across, 0–1. */
  spread?: number;
  startTop?: DimensionValue;
}

export default function ConfettiFall({
  count = 26,
  fallDistance = 420,
  spread = 0.7,
  startTop = '15%',
}: ConfettiFallProps) {
  const pieces = useMemo(() => buildConfetti(count, spread), [count, spread]);

  return (
    <View style={styles.wrap} pointerEvents="none">
      {pieces.map((piece, index) => (
        <ConfettiPiece
          key={index}
          {...piece}
          fallDistance={fallDistance}
          startTop={startTop}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  piece: {
    position: 'absolute',
    top: '15%',
  },
});
