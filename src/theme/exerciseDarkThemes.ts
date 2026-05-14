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
  progressTrack: string;
  progressFill: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textAccent: string;
  iconPrimary: string;
}

export const EXERCISE_DARK_THEMES: ExerciseDarkTheme[] = [
  {
    id: 'light',
    label: 'Light',
    dotColor: '#78B4FF',
    screen: '#F8FBFF',
    surface: '#F1F5F9',
    surfaceBorder: '#E2E8F0',
    circleOutline: '#78B4FF',
    circleOutlineOpacity: 0.5,
    circleOuter: '#78B4FF',
    circleOuterOpacity: 0.28,
    circleInner: '#4A90F5',
    progressTrack: '#E2E8F0',
    progressFill: '#78B4FF',
    textPrimary: '#2e333a',
    textSecondary: '#3f4855',
    textTertiary: '#94A3B8',
    textAccent: '#2F7AEF',
    iconPrimary: '#0F172A',
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
    progressTrack: '#1C2130',
    progressFill: '#4A6090',
    textPrimary: '#C8D4E8',
    textSecondary: '#8A98B4',
    textTertiary: '#5A6880',
    textAccent: '#6A90C8',
    iconPrimary: '#C8D4E8',
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
    circleInner: '#4A3E36',
    progressTrack: '#1E1C1A',
    progressFill: '#7A6A5E',
    textPrimary: '#E0D8D0',
    textSecondary: '#A09088',
    textTertiary: '#6A5E56',
    textAccent: '#C8A880',
    iconPrimary: '#E0D8D0',
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
    circleInner: '#1E3A32',
    progressTrack: '#162018',
    progressFill: '#4A7060',
    textPrimary: '#C4D8D0',
    textSecondary: '#7A9A90',
    textTertiary: '#4A6860',
    textAccent: '#6AB890',
    iconPrimary: '#C4D8D0',
  },
];
