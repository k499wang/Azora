import { colors } from './colors';

export interface ExerciseDarkTheme {
  id: 'light' | 'slate' | 'stone' | 'sage';
  label: string;
  dotColor: string;
  screen: string;
  surface: string;
  surfaceBorder: string;
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
  iconPrimary: string;
  backdropExhale: BreathBackdropColors;
  backdropInhale: BreathBackdropColors;
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
    dotColor: '#63ADFF',
    screen: colors.background.canvas,
    // Warm siblings of the cream screen: a cool grey panel on it read as a
    // different material rather than a raised part of the same one.
    surface: '#F3EBE1',
    surfaceBorder: '#E7DCCE',
    circleOutline: '#63ADFF',
    circleOutlineOpacity: 0.5,
    // The breathing companion's body and aura. Shares Mochi's token so the
    // mascot is one colour wherever he appears.
    circleOuter: colors.roomBlob.body,
    circleOuterOpacity: 0.28,
    circleInner: '#3D93FF',
    beatFlush: '#1F7BFF',
    progressTrack: '#E7DCCE',
    progressFill: '#63ADFF',
    textPrimary: '#2e333a',
    textSecondary: '#3f4855',
    textTertiary: '#94A3B8',
    textAccent: '#1F7BFF',
    iconPrimary: '#0F172A',
    backdropExhale: ['#63ADFF14', '#63ADFF00', '#63ADFF0F'],
    backdropInhale: ['#63ADFF3D', '#63ADFF00', '#63ADFF29'],
  },
  {
    id: 'slate',
    label: 'Slate',
    dotColor: '#4A6090',
    screen: '#111318',
    surface: '#1C2130',
    surfaceBorder: '#282E40',
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
    iconPrimary: '#C8D4E8',
    backdropExhale: ['#4A609014', '#4A609000', '#4A60900F'],
    backdropInhale: ['#4A609047', '#4A609000', '#4A60902E'],
  },
  {
    id: 'stone',
    label: 'Stone',
    dotColor: '#7A6A5E',
    screen: '#131210',
    surface: '#1E1C1A',
    surfaceBorder: '#2A2824',
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
    iconPrimary: '#E0D8D0',
    backdropExhale: ['#7A6A5E14', '#7A6A5E00', '#7A6A5E0F'],
    backdropInhale: ['#7A6A5E47', '#7A6A5E00', '#7A6A5E2E'],
  },
  {
    id: 'sage',
    label: 'Sage',
    dotColor: '#4A7060',
    screen: '#0E1412',
    surface: '#162018',
    surfaceBorder: '#1E2E28',
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
    iconPrimary: '#C4D8D0',
    backdropExhale: ['#4A706014', '#4A706000', '#4A70600F'],
    backdropInhale: ['#4A706047', '#4A706000', '#4A70602E'],
  },
];
