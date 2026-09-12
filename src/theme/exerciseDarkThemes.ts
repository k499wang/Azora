import { colors } from './colors';

export interface ExerciseDarkTheme {
  id: 'light' | 'slate' | 'stone' | 'sage';
  label: string;
  dotColor: string;
  screen: string;
  surface: string;
  surfaceBorder: string;
  // Small inline controls — the session-length pill and its menu — sit directly
  // on `screen` instead of inside a panel, so they read a step lighter than
  // `surface` to stay legible without turning into a card.
  controlSurface: string;
  controlBorder: string;
  circleOutline: string;
  circleOutlineOpacity: number;
  circleOuter: string;
  circleOuterOpacity: number;
  circleInner: string;
  beatFlush: string;
  progressTrack: string;
  progressFill: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textAccent: string;
  /**
   * The accent as a filled surface — the session's Start button. Split from
   * `textAccent` because a fill and a label have opposite contrast needs: on
   * the light theme the accent has to lighten to match the app's primary
   * button, which is exactly the direction that would wash out accent text on
   * the cream screen. The dark themes carry the same value for both.
   */
  accentFill: string;
  iconPrimary: string;
  backdropExhale: BreathBackdropColors;
  backdropInhale: BreathBackdropColors;
  /**
   * Azo, retoned for the theme he is standing in. He keeps his artwork's tonal
   * order — body, a darker shade for cartilage and nose, a lighter belly and a
   * warm inner ear — so only the hue changes, never the read of the character.
   */
  companion: CompanionColors;
}

export interface CompanionColors {
  body: string;
  /** ear cartilage, nose and mouth */
  shade: string;
  /** belly */
  light: string;
  /** inner ear — a warm note carried at the theme's own lightness */
  earInner: string;
  eyeWhite: string;
  /** irises, and the lids they close behind */
  iris: string;
}

// Composited over `screen`, top to bottom, at BREATH_BACKDROP_LOCATIONS. The
// middle stop stays fully transparent so the breathing circle never sits on a
// tinted field.
export type BreathBackdropColors = readonly [string, string, string];

export const BREATH_BACKDROP_LOCATIONS = [0, 0.55, 1] as const;

export const EXERCISE_DARK_THEMES: ExerciseDarkTheme[] = [
  {
    id: 'light',
    label: 'Light',
    dotColor: colors.primary.blue400,
    screen: colors.background.canvas,
    // Warm siblings of the cream screen: a cool grey panel on it read as a
    // different material rather than a raised part of the same one.
    surface: '#F3EBE1',
    surfaceBorder: '#E7DCCE',
    controlSurface: '#F9F3ED',
    controlBorder: '#EBE1D4',
    circleOutline: colors.primary.blue400,
    circleOutlineOpacity: 0.5,
    // The breathing companion's body and aura. Shares Mochi's token so the
    // mascot is one colour wherever he appears.
    circleOuter: colors.roomBlob.body,
    circleOuterOpacity: 0.28,
    circleInner: colors.primary.blue500,
    // A beat has to read as a brightening, so the flush sits a rung *above*
    // `circleInner`, the way every dark theme's does. It used to be a rung
    // below, which made the light theme pulse darker than the other three.
    beatFlush: colors.primary.blue400,
    progressTrack: '#E7DCCE',
    progressFill: colors.primary.blue400,
    textPrimary: '#2e333a',
    textSecondary: '#3f4855',
    textTertiary: '#94A3B8',
    textAccent: colors.primary.blue600,
    accentFill: colors.primary.blue500,
    iconPrimary: '#0F172A',
    // Idle and exhale settle back onto the same cream canvas used by Home.
    backdropExhale: [
      `${colors.background.canvas}00`,
      `${colors.background.canvas}00`,
      `${colors.background.canvas}00`,
    ],
    backdropInhale: [
      `${colors.primary.blue400}3D`,
      `${colors.primary.blue400}00`,
      `${colors.primary.blue400}29`,
    ],
    companion: {
      body: colors.koala.body,
      shade: colors.koala.shade,
      light: colors.koala.light,
      earInner: colors.koala.earInner,
      eyeWhite: colors.koala.eyeWhite,
      iris: colors.koala.iris,
    },
  },
  {
    id: 'slate',
    label: 'Slate',
    dotColor: '#4A6090',
    screen: '#111318',
    surface: '#1C2130',
    surfaceBorder: '#282E40',
    controlSurface: '#242A3A',
    controlBorder: '#333A4D',
    circleOutline: '#4A6090',
    circleOutlineOpacity: 0.55,
    circleOuter: '#4A6090',
    circleOuterOpacity: 0.42,
    circleInner: '#2A3F6B',
    beatFlush: '#6A90C8',
    progressTrack: '#1C2130',
    progressFill: '#4A6090',
    textPrimary: '#C8D4E8',
    textSecondary: '#8A98B4',
    textTertiary: '#5A6880',
    textAccent: '#6A90C8',
    accentFill: '#6A90C8',
    iconPrimary: '#C8D4E8',
    backdropExhale: ['#4A609014', '#4A609000', '#4A60900F'],
    backdropInhale: ['#4A609047', '#4A609000', '#4A60902E'],
    companion: {
      body: '#6C8ECB',
      shade: '#3C5A90',
      light: '#A8C0E8',
      earInner: '#E4BACD',
      eyeWhite: '#E6EEFA',
      iris: '#16233F',
    },
  },
  {
    id: 'stone',
    label: 'Stone',
    dotColor: '#7A6A5E',
    screen: '#131210',
    surface: '#1E1C1A',
    surfaceBorder: '#2A2824',
    controlSurface: '#282522',
    controlBorder: '#37332D',
    circleOutline: '#7A6A5E',
    circleOutlineOpacity: 0.55,
    circleOuter: '#7A6A5E',
    circleOuterOpacity: 0.42,
    circleInner: '#2E2620',
    beatFlush: '#C8A880',
    progressTrack: '#1E1C1A',
    progressFill: '#7A6A5E',
    textPrimary: '#E0D8D0',
    textSecondary: '#A09088',
    textTertiary: '#6A5E56',
    textAccent: '#C8A880',
    accentFill: '#C8A880',
    iconPrimary: '#E0D8D0',
    backdropExhale: ['#7A6A5E14', '#7A6A5E00', '#7A6A5E0F'],
    backdropInhale: ['#7A6A5E47', '#7A6A5E00', '#7A6A5E2E'],
    companion: {
      body: '#A88F76',
      shade: '#6E5A45',
      light: '#DCC8AE',
      earInner: '#E7BDB6',
      eyeWhite: '#F5EBDF',
      iris: '#2C2218',
    },
  },
  {
    id: 'sage',
    label: 'Sage',
    dotColor: '#4A7060',
    screen: '#0E1412',
    surface: '#162018',
    surfaceBorder: '#1E2E28',
    controlSurface: '#1D2A23',
    controlBorder: '#293A32',
    circleOutline: '#4A7060',
    circleOutlineOpacity: 0.55,
    circleOuter: '#4A7060',
    circleOuterOpacity: 0.42,
    circleInner: '#0F241E',
    beatFlush: '#6AB890',
    progressTrack: '#162018',
    progressFill: '#4A7060',
    textPrimary: '#C4D8D0',
    textSecondary: '#7A9A90',
    textTertiary: '#4A6860',
    textAccent: '#6AB890',
    accentFill: '#6AB890',
    iconPrimary: '#C4D8D0',
    backdropExhale: ['#4A706014', '#4A706000', '#4A70600F'],
    backdropInhale: ['#4A706047', '#4A706000', '#4A70602E'],
    companion: {
      body: '#74AE90',
      shade: '#427060',
      light: '#B6DAC6',
      earInner: '#DDB7C3',
      eyeWhite: '#E7F3EC',
      iris: '#112620',
    },
  },
];
