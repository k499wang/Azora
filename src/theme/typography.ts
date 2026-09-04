import { TextStyle } from 'react-native';
import { isTablet } from './tablet';

type FontWeight = TextStyle['fontWeight'];

const weight = {
  light: '300' as FontWeight,
  regular: '400' as FontWeight,
  medium: '500' as FontWeight,
  semibold: '600' as FontWeight,
  // App rule: SemiBold is the heaviest face the app renders.
  bold: '600' as FontWeight,
};

// Single app-wide font family. Switch to try any of:
// 'Cormorant' | 'Raleway' | 'Outfit' | 'Manrope' | 'Urbanist' | 'Fredoka' | 'Baloo2' | 'Unbounded' | 'Sniglet' | 'Nunito'
const FONT_FAMILY = 'Outfit';

const fontBold = `${FONT_FAMILY}-SemiBold`;
// Real Bold face. Reserved for paywall headlines, where the extra weight is a
// deliberate emphasis break from the app-wide SemiBold ceiling.
const fontHeavy = `${FONT_FAMILY}-ExtraBold`;
const fontSemiBold = `${FONT_FAMILY}-SemiBold`;
const fontRegular = `${FONT_FAMILY}-Regular`;
const fontMedium = `${FONT_FAMILY}-Medium`;
const fontLight = `${FONT_FAMILY}-Light`;

const baseTypography = {
  display: {
    display1: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 48,
      lineHeight: 56,
    },
    display2: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 40,
      lineHeight: 48,
    },
    display3: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 32,
      lineHeight: 40,
    },
  },

  title: {
    title1: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 28,
      lineHeight: 36,
    },
    title2: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 24,
      lineHeight: 32,
    },
    title3: {
      fontFamily: fontSemiBold,
      fontWeight: weight.semibold,
      fontSize: 22,
      lineHeight: 30,
    },
  },

  heading: {
    heading1: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
      fontSize: 18,
      lineHeight: 26,
    },
    heading2: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
      fontSize: 16,
      lineHeight: 24,
    },
  },

  body: {
    large: {
      fontFamily: fontLight,
      fontWeight: weight.light,
      fontSize: 18,
      lineHeight: 28,
    },
    medium: {
      fontFamily: fontLight,
      fontWeight: weight.light,
      fontSize: 16,
      lineHeight: 24,
    },
    small: {
      fontFamily: fontLight,
      fontWeight: weight.light,
      fontSize: 14,
      lineHeight: 22,
    },
    xsmall: {
      fontFamily: fontLight,
      fontWeight: weight.light,
      fontSize: 12,
      lineHeight: 18,
    },
  },

  label: {
    large: {
      fontFamily: fontRegular,
      fontWeight: weight.regular,
      fontSize: 16,
      lineHeight: 20,
    },
    medium: {
      fontFamily: fontRegular,
      fontWeight: weight.regular,
      fontSize: 14,
      lineHeight: 18,
    },
    small: {
      fontFamily: fontRegular,
      fontWeight: weight.regular,
      fontSize: 12,
      lineHeight: 16,
    },
    // Shared size for card metadata rows (category, duration, schedule).
    detail: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
      fontSize: 13,
      lineHeight: 16,
    },
  },

  // Card stat scales — big values with secondary units (HRV, BPM, stress).
  stat: {
    // Compact value inside multi-stat cells (Avg / Best).
    value: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
      fontSize: 21,
      lineHeight: 26,
      fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
      letterSpacing: -0.3,
    },
    // Standalone value inside a stat card.
    valueMedium: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
      fontSize: 30,
      lineHeight: 36,
      fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
      letterSpacing: -0.3,
    },
    // Emphasized hero value.
    valueLarge: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
      fontSize: 34,
      lineHeight: 42,
      fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
      letterSpacing: -0.5,
    },
    // Compact secondary unit (multi-stat cells).
    unit: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
      fontSize: 14,
      lineHeight: 18,
    },
    // Standalone secondary unit next to a value.
    unitMedium: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
      fontSize: 16,
      lineHeight: 20,
    },
    // Emphasized unit next to an emphasized value.
    unitLarge: {
      fontFamily: fontBold,
      fontWeight: weight.semibold,
      fontSize: 18,
      lineHeight: 22,
    },
  },

  button: {
    large: {
      fontFamily: fontMedium,
      fontWeight: weight.medium,
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

  input: {
    text: {
      fontFamily: fontLight,
      fontWeight: weight.light,
      fontSize: 16,
      lineHeight: 24,
    },
    label: {
      fontFamily: fontRegular,
      fontWeight: weight.regular,
      fontSize: 14,
      lineHeight: 18,
    },
    helper: {
      fontFamily: fontLight,
      fontWeight: weight.light,
      fontSize: 12,
      lineHeight: 16,
    },
  },

  caption: {
    caption1: {
      fontFamily: fontLight,
      fontWeight: weight.light,
      fontSize: 12,
      lineHeight: 16,
    },
    caption2: {
      fontFamily: fontRegular,
      fontWeight: weight.regular,
      fontSize: 11,
      lineHeight: 14,
    },
  },

  overline: {
    fontFamily: fontMedium,
    fontWeight: weight.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
};

/**
 * How much larger type is drawn on a tablet.
 *
 * An iPad is held further from the eye than a phone, so matching point sizes
 * read a size smaller. This is deliberately a nudge rather than the ~1.3x the
 * extra screen might suggest: about a hundred components size a control by a
 * fixed `height`, and type that outgrows those boxes clips instead of
 * reflowing. Raising this is a per-screen check on a tablet, not a safe edit.
 *
 * It pairs with `breakpoints.contentMaxWidth`: 480pt at 1.1 carries the same
 * characters per line as a 390pt phone at 1.0, so line length holds steady.
 */
const TABLET_TYPE_SCALE = 1.1;

const TYPE_SCALE = isTablet ? TABLET_TYPE_SCALE : 1;

function scaleToken<T extends TextStyle>(token: T): T {
  if (TYPE_SCALE === 1) return token;

  const scaled: TextStyle = { ...token };
  if (typeof token.fontSize === 'number') {
    scaled.fontSize = Math.round(token.fontSize * TYPE_SCALE);
  }
  if (typeof token.lineHeight === 'number') {
    scaled.lineHeight = Math.round(token.lineHeight * TYPE_SCALE);
  }
  return scaled as T;
}

function scaleGroup<T extends Record<string, TextStyle>>(group: T): T {
  if (TYPE_SCALE === 1) return group;

  return Object.fromEntries(
    Object.entries(group).map(([name, token]) => [name, scaleToken(token)]),
  ) as T;
}

export const typography = {
  display: scaleGroup(baseTypography.display),
  title: scaleGroup(baseTypography.title),
  heading: scaleGroup(baseTypography.heading),
  body: scaleGroup(baseTypography.body),
  label: scaleGroup(baseTypography.label),
  stat: scaleGroup(baseTypography.stat),
  button: scaleGroup(baseTypography.button),
  input: scaleGroup(baseTypography.input),
  caption: scaleGroup(baseTypography.caption),
  overline: scaleToken(baseTypography.overline),
};

/**
 * Line height for a short label that wraps — a card title, a list row. The body
 * and title tokens are spaced for paragraphs, and at that spacing a title that
 * breaks onto a second line reads as two separate items rather than one thought.
 * Takes the token's own already-scaled size, so it follows the tablet type scale.
 */
export function wrappedLineHeight(fontSize: number): number {
  return Math.round(fontSize * 1.24);
}

export const fonts = { heavy: fontHeavy, bold: fontBold, semibold: fontSemiBold, regular: fontRegular, medium: fontMedium, light: fontLight };
