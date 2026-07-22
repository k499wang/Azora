export const colors = {
  primary: {
    blue100: '#EAF2FF',
    blue200: '#C8DBFF',
    blue300: '#A0C4FF',
    blue400: '#78B4FF',
    blue500: '#4A90F5',
    blue600: '#2F7AEF',
    blue700: '#1E63D6',
    blue800: '#154AAB',
    blue900: '#0D3380',
  },

  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  success: {
    100: '#DCFCE7',
    300: '#86EFAC',
    500: '#22C55E',
    700: '#15803D',
  },

  warning: {
    100: '#FEF3C7',
    300: '#FDE68A',
    500: '#F59E0B',
    700: '#B45309',
  },

  error: {
    100: '#FEE2E2',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    700: '#B91C1C',
  },

  yellow: {
    100: '#FEF9C3',
    300: '#FDE047',
    400: '#FACC15',
    500: '#EAB308',
  },

  orange: {
    100: '#FFF4E6',
    200: '#FFE0BF',
    300: '#FFBD6B',
    400: '#FF9A3D',
    500: '#FF8C00',
    600: '#E67700',
    700: '#CC6A00',
  },

  background: {
    // Cool neutral canvas for the frosted/glass paradigm — glass surfaces refract
    // against grey rather than blue tint.
    primary: '#F4F5F7',
    secondary: '#EEF5FF',
    elevated: '#FFFFFF',
    card: '#FAFCFF',
    accentSoft: '#EAF2FF',
    // Warm cream for paper/letter surfaces (FounderNoteScreen).
    paper: '#FBF7EF',
    // Asset-matched fallbacks used while native background images decode.
    sunset: '#042B62',
    dawn: '#FCBF9B',
    lagoon: '#1B708C',
  },

  // Desaturated brand blue (slate-leaning) for the premium/greyish direction.
  // Use in place of primary.blue* on surfaces being migrated to glass.
  accent: {
    100: '#EEF1F6',
    200: '#D8E0EC',
    300: '#B9C6DA',
    500: '#5B7CA6',
    600: '#4A6890',
    700: '#3B5577',
  },

  // Frosted-glass tokens. fill sits over a BlurView; edge is the top highlight.
  glass: {
    fill: 'rgba(248,250,252,0.62)',
    // Lighter tint for the 'clear' variant — over media / vibrant backgrounds.
    fillClear: 'rgba(248,250,252,0.30)',
    fillStrong: 'rgba(248,250,252,0.80)',
    edge: 'rgba(255,255,255,0.55)',
    edgeStrong: 'rgba(255,255,255,0.78)',
    shadow: '#0F172A',
    // Opaque scrim for the 'solid' glass fallback, used when Reduce
    // Transparency asks us to avoid blur/translucency.
    scrim: 'rgba(244,245,247,0.94)',
    lockedScrim: '#F4F5F7',
    // Dark counterpart for colorScheme="dark" surfaces on the solid fallback.
    scrimDark: 'rgba(15,23,42,0.94)',
    // White-leaning fills for glass controls placed over imagery/vibrant media.
    fillOnImage: 'rgba(255,255,255,0.68)',
    tintOnImage: 'rgba(255,255,255,0.48)',
    // Frosted white chrome for navigation surfaces (dock / tab bar).
    navTint: 'rgba(255,255,255,0.66)',
    navFill: 'rgba(255,255,255,0.82)',
  },

  surface: {
    welcome: '#FAF6F0',
  },

  text: {
    primary: '#3A434F',
    secondary: '#5B6675',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
    brand: '#2F7AEF',
  },

  border: {
    subtle: '#E2E8F0',
    default: '#CBD5E1',
    strong: '#94A3B8',
    brand: '#78B4FF',
  },

  overlay: {
    light: '#FFFFFFCC',
    dark: '#0F172A66',
  },

  // Single scrim treatment for text over nature photography — every photo
  // card fades to the same deep blue-black so imagery reads as one atmosphere.
  photoScrim: {
    transparent: 'rgba(12,16,33,0)',
    soft: 'rgba(12,16,33,0.35)',
    medium: 'rgba(12,16,33,0.6)',
    strong: 'rgba(12,16,33,0.82)',
  },

  mood: {
    stressed: '#F59E0B',
    anxious: '#7C3AED',
    sleepless: '#1E40AF',
    focus: '#2F7AEF',
    angry: '#EF4444',
    lowEnergy: '#F97316',
  },

  // Loading placeholder tones. `base` is the resting block fill, `highlight`
  // the lighter sweep used by the shimmer gradient.
  skeleton: {
    base: '#E2E8F0',
    highlight: '#FFFFFF',
  },
} as const;
