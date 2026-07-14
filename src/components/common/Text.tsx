import { forwardRef } from 'react';
import {
  Animated,
  Text as RNText,
  TextInput as RNTextInput,
} from 'react-native';
import type { TextInputProps, TextProps } from 'react-native';

// System font scaling (Dynamic Type / Android font size) is disabled app-wide.
// To re-enable with a cap, swap allowFontScaling={false} for maxFontSizeMultiplier here.
export function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

export function AnimatedText(props: Animated.AnimatedProps<TextProps>) {
  return <Animated.Text allowFontScaling={false} {...props} />;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  function TextInput(props, ref) {
    return <RNTextInput ref={ref} allowFontScaling={false} {...props} />;
  }
);
