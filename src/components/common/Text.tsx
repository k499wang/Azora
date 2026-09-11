import { forwardRef } from 'react';
import {
  Animated,
  Text as RNText,
  TextInput as RNTextInput,
} from 'react-native';
import type { TextInputProps, TextProps } from 'react-native';
import { fonts } from '../../theme/typography';

// System font scaling (Dynamic Type / Android font size) is disabled app-wide.
// To re-enable with a cap, swap allowFontScaling={false} for maxFontSizeMultiplier here.
export function Text({ style, ...props }: TextProps) {
  return (
    <RNText
      allowFontScaling={false}
      {...props}
      style={[{ fontFamily: fonts.regular }, style]}
    />
  );
}

export function AnimatedText({ style, ...props }: Animated.AnimatedProps<TextProps>) {
  return (
    <Animated.Text
      allowFontScaling={false}
      {...props}
      style={[{ fontFamily: fonts.regular }, style]}
    />
  );
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  function TextInput({ style, ...props }, ref) {
    return (
      <RNTextInput
        ref={ref}
        allowFontScaling={false}
        {...props}
        style={[{ fontFamily: fonts.regular }, style]}
      />
    );
  }
);
