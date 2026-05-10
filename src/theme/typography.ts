import { TextStyle } from 'react-native';

type FontWeight = TextStyle['fontWeight'];

const weight = {
  regular: '400' as FontWeight,
  medium: '500' as FontWeight,
  semibold: '600' as FontWeight,
  bold: '700' as FontWeight,
};

// Single app-wide font family. Switch to try any of:
// 'Urbanist' | 'Fredoka' | 'Baloo2' | 'Unbounded' | 'Sniglet' | 'Nunito'
const FONT_FAMILY = 'Urbanist';

const fontBold = `${FONT_FAMILY}-Bold`;
const fontSemiBold = `${FONT_FAMILY}-SemiBold`;
const fontRegular = `${FONT_FAMILY}-Regular`;
const fontMedium = `${FONT_FAMILY}-Medium`;

export const typography = {
  display: {
    display1: {
      fontFamily: fontBold,
      fontWeight: weight.bold,
      fontSize: 48,
      lineHeight: 56,
    },
    display2: {
      fontFamily: fontBold,
      fontWeight: weight.bold,
      fontSize: 40,
      lineHeight: 48,
    },
    display3: {
      fontFamily: fontBold,
      fontWeight: weight.bold,
      fontSize: 32,
      lineHeight: 40,
    },
  },

  title: {
    title1: {
      fontFamily: fontBold,
      fontWeight: weight.bold,
      fontSize: 28,
      lineHeight: 36,
    },
    title2: {
      fontFamily: fontBold,
      fontWeight: weight.bold,
      fontSize: 24,
      lineHeight: 32,
    },
    title3: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 20,
      lineHeight: 28,
    },
  },

  heading: {
    heading1: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 18,
      lineHeight: 26,
    },
    heading2: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 16,
      lineHeight: 24,
    },
  },

  body: {
    large: {
      fontFamily: fontRegular,
      fontWeight: weight.regular,
      fontSize: 18,
      lineHeight: 28,
    },
    medium: {
      fontFamily: fontRegular,
      fontWeight: weight.regular,
      fontSize: 16,
      lineHeight: 24,
    },
    small: {
      fontFamily: fontRegular,
      fontWeight: weight.regular,
      fontSize: 14,
      lineHeight: 22,
    },
    xsmall: {
      fontFamily: fontRegular,
      fontWeight: weight.regular,
      fontSize: 12,
      lineHeight: 18,
    },
  },

  label: {
    large: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 16,
      lineHeight: 20,
    },
    medium: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
      fontSize: 14,
      lineHeight: 18,
    },
    small: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
      fontSize: 12,
      lineHeight: 16,
    },
  },

  button: {
    large: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 16,
      lineHeight: 20,
    },
    medium: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 14,
      lineHeight: 18,
    },
    small: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 12,
      lineHeight: 16,
    },
  },

  input: {
    text: {
      fontFamily: fontRegular,
      fontWeight: weight.regular,
      fontSize: 16,
      lineHeight: 24,
    },
    label: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
      fontSize: 14,
      lineHeight: 18,
    },
    helper: {
      fontFamily: fontRegular,
      fontWeight: weight.regular,
      fontSize: 12,
      lineHeight: 16,
    },
  },

  caption: {
    caption1: {
      fontFamily: fontRegular,
      fontWeight: weight.regular,
      fontSize: 12,
      lineHeight: 16,
    },
    caption2: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
      fontSize: 11,
      lineHeight: 14,
    },
  },

  overline: {
    fontFamily: fontSemiBold,
    fontWeight: weight.semibold,
    fontSize: 10,
    lineHeight: 14,
  },
} as const;

export const fonts = { bold: fontBold, semibold: fontSemiBold, regular: fontRegular, medium: fontMedium };
