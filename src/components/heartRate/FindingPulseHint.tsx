import { Text, AnimatedText } from '../common/Text';
import { useEffect, useRef } from 'react';
import {
  Animated, type StyleProp, type TextStyle } from 'react-native';

const DOT_COUNT = 3;
const DOT_STEP_MS = 260;
const DOT_REST_OPACITY = 0.25;

interface FindingPulseHintProps {
  textStyle: StyleProp<TextStyle>;
}

export function FindingPulseHint({ textStyle }: FindingPulseHintProps) {
  const dotOpacities = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(DOT_REST_OPACITY)),
  ).current;

  useEffect(() => {
    const wave = Animated.loop(
      Animated.stagger(
        DOT_STEP_MS,
        dotOpacities.map((opacity) =>
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: DOT_STEP_MS,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: DOT_REST_OPACITY,
              duration: DOT_STEP_MS,
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
    );
    wave.start();
    return () => wave.stop();
  }, [dotOpacities]);

  return (
    <Text style={textStyle}>
      {'Finding your pulse'}
      {dotOpacities.map((opacity, index) => (
        <AnimatedText key={index} style={{ opacity }}>
          {'.'}
        </AnimatedText>
      ))}
    </Text>
  );
}
