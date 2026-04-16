import { TextStyle } from 'react-native';

type FontWeight = TextStyle['fontWeight'];

const weight = {
  regular: '400' as FontWeight,
  medium: '500' as FontWeight,
  semibold: '600' as FontWeight,
  bold: '700' as FontWeight,
};

export const typography = {
  display: {
    display1: {
      fontFamily: 'Nunito-Bold',
      fontWeight: weight.bold,
      fontSize: 48,
      lineHeight: 56,
    },
    display2: {
      fontFamily: 'Nunito-Bold',
      fontWeight: weight.bold,
      fontSize: 40,
      lineHeight: 48,
    },
    display3: {
      fontFamily: 'Nunito-Bold',
      fontWeight: weight.bold,
      fontSize: 32,
      lineHeight: 40,
    },
  },

  title: {
    title1: {
      fontFamily: 'Nunito-Bold',
      fontWeight: weight.bold,
      fontSize: 28,
      lineHeight: 36,
    },
    title2: {
      fontFamily: 'Nunito-Bold',
      fontWeight: weight.bold,
      fontSize: 24,
      lineHeight: 32,
    },
    title3: {
      fontFamily: 'Nunito-SemiBold',
      fontWeight: weight.semibold,
      fontSize: 20,
      lineHeight: 28,
    },
  },

  heading: {
    heading1: {
      fontFamily: 'Nunito-SemiBold',
      fontWeight: weight.semibold,
      fontSize: 18,
      lineHeight: 26,
    },
    heading2: {
      fontFamily: 'Nunito-SemiBold',
      fontWeight: weight.semibold,
      fontSize: 16,
      lineHeight: 24,
    },
  },

  body: {
    large: {
      fontFamily: 'Nunito-Regular',
      fontWeight: weight.regular,
      fontSize: 18,
      lineHeight: 28,
    },
    medium: {
      fontFamily: 'Nunito-Regular',
      fontWeight: weight.regular,
      fontSize: 16,
      lineHeight: 24,
    },
    small: {
      fontFamily: 'Nunito-Regular',
      fontWeight: weight.regular,
      fontSize: 14,
      lineHeight: 22,
    },
    xsmall: {
      fontFamily: 'Nunito-Regular',
      fontWeight: weight.regular,
      fontSize: 12,
      lineHeight: 18,
    },
  },

  label: {
    large: {
      fontFamily: 'Nunito-SemiBold',
      fontWeight: weight.semibold,
      fontSize: 16,
      lineHeight: 20,
    },
    medium: {
      fontFamily: 'Nunito-Medium',
      fontWeight: weight.medium,
      fontSize: 14,
      lineHeight: 18,
    },
    small: {
      fontFamily: 'Nunito-Medium',
      fontWeight: weight.medium,
      fontSize: 12,
      lineHeight: 16,
    },
  },

  button: {
    large: {
      fontFamily: 'Nunito-SemiBold',
      fontWeight: weight.semibold,
      fontSize: 16,
      lineHeight: 20,
    },
    medium: {
      fontFamily: 'Nunito-SemiBold',
      fontWeight: weight.semibold,
      fontSize: 14,
      lineHeight: 18,
    },
    small: {
      fontFamily: 'Nunito-SemiBold',
      fontWeight: weight.semibold,
      fontSize: 12,
      lineHeight: 16,
    },
  },

  input: {
    text: {
      fontFamily: 'Nunito-Regular',
      fontWeight: weight.regular,
      fontSize: 16,
      lineHeight: 24,
    },
    label: {
      fontFamily: 'Nunito-Medium',
      fontWeight: weight.medium,
      fontSize: 14,
      lineHeight: 18,
    },
    helper: {
      fontFamily: 'Nunito-Regular',
      fontWeight: weight.regular,
      fontSize: 12,
      lineHeight: 16,
    },
  },

  caption: {
    caption1: {
      fontFamily: 'Nunito-Regular',
      fontWeight: weight.regular,
      fontSize: 12,
      lineHeight: 16,
    },
    caption2: {
      fontFamily: 'Nunito-Medium',
      fontWeight: weight.medium,
      fontSize: 11,
      lineHeight: 14,
    },
  },

  overline: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: weight.semibold,
    fontSize: 10,
    lineHeight: 14,
  },
} as const;
