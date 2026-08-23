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

  // Playful multi-hue families for the color-blocked home surfaces. `base` is a
  // saturated fill that carries white text (all bases clear 3:1 against white),
  // `soft` is the receded/completed tint, `ink` is the text color on `soft`.
  // `mid` is base lifted ~35% toward soft. It exists so a color block can carry
  // a gradient that stays inside the saturated range — base to mid reads as
  // depth, where base to soft washes out to a near-white corner.
  playful: {
    teal: { base: '#00A391', mid: '#3BBAAB', soft: '#A8E5DA', ink: '#0B6B5C' },
    coral: { base: '#F04E30', mid: '#F4785F', soft: '#FAC7B6', ink: '#B23A1D' },
    violet: { base: '#6C4BFF', mid: '#8F76FE', soft: '#CFC5FB', ink: '#4B34C4' },
    amber: { base: '#D97706', mid: '#E49B3D', soft: '#F8DEA3', ink: '#925C00' },
    sky: { base: '#2979FF', mid: '#5F9BFE', soft: '#C3DBFC', ink: '#1559A8' },
    blush: { base: '#F0488F', mid: '#F377AC', soft: '#F8CFE3', ink: '#A12359' },
  },

  // White-alpha layers for content sitting on a `playful.*.base` color block:
  // tinted cells, dividers, and secondary text that must stay legible on the fill.
  onBlock: {
    fill: 'rgba(255,255,255,0.16)',
    fillActive: 'rgba(255,255,255,0.34)',
    divider: 'rgba(255,255,255,0.24)',
    textMuted: 'rgba(255,255,255,0.78)',
    textFaint: 'rgba(255,255,255,0.45)',
  },

  // The hex room's resident. Mint reads as a character rather than furniture
  // against the room's warm cream floor, and stays distinct from every frame hue.
  roomBlob: {
    body: '#57C9B7',
    bodyLight: '#7FDCCC',
    foot: '#39AC9A',
    face: '#1F423C',
    // the pop of sparkles when the blob is poked
    sparkle: '#FFC94D',
    // blush on the portrait crop, where his face carries the whole frame; warm
    // against the mint so the cheeks read as colour rather than another highlight
    cheek: '#F4785F',
    // matches the shadow ink the room artwork already uses
    shadow: 'rgba(58,67,79,0.22)',
    // the clipboard he takes notes on — warm wood against his mint
    board: '#C08A54',
    boardEdge: '#8A5A2E',
  },

  background: {
    // Cool neutral canvas for the frosted/glass paradigm — glass surfaces refract
    // against grey rather than blue tint.
    primary: '#F4F5F7',
    // Near-white canvas the playful color blocks sit on.
    canvas: '#F7F8FB',
    secondary: '#EEF5FF',
    elevated: '#FFFFFF',
    // Cards read pure white, matching Today's Dailies. Every card surface uses
    // this so the app has one card white, not two that are nearly the same.
    card: '#FFFFFF',
    // An off-white for outlined surfaces that sit directly on `canvas` — close
    // enough to the canvas that the rows settle into the page, still a shade
    // lighter so each one reads as its own surface.
    cardSoft: '#FAFBFD',
    accentSoft: '#EAF2FF',
    // Blue block behind the top bar, curving into the page canvas.
    headerTint: '#78B4FF',
    // Warm cream for paper/letter surfaces.
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

  // Paywall chrome sits over the sunset photo, so its surfaces are translucent
  // white/navy rather than the opaque background tokens.
  paywall: {
    cardEdge: 'rgba(160,196,255,0.35)',
    tray: 'rgba(10,28,68,0.92)',
    divider: 'rgba(255,255,255,0.35)',
    iconFill: 'rgba(255,255,255,0.16)',
    controlEdge: 'rgba(255,255,255,0.45)',
    toggleFill: 'rgba(255,255,255,0.08)',
    toggleEdge: 'rgba(255,255,255,0.12)',
    switchTrack: 'rgba(255,255,255,0.20)',
    textMuted: 'rgba(255,255,255,0.72)',
    textFaint: 'rgba(255,255,255,0.58)',
    // success[300] at zero alpha. The trial rail dissolves rather than stopping
    // square — a hard end-stop reads as the relationship ending on billing day.
    trialRailTail: 'rgba(134,239,172,0)',
  },

  surface: {
    welcome: '#FAF6F0',
  },

  // Official third-party brand colors, used only to tint the acquisition-source
  // logos in onboarding. Not part of the Azora palette — never reuse for UI.
  channel: {
    instagram: '#FF0069',
    facebook: '#0866FF',
    reddit: '#FF4500',
    appStore: '#0D96F6',
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

  // Translucent action banners pinned over photography. Kept on the same
  // blue-black as `photoScrim` so banners and scrims share one atmosphere.
  photoBanner: {
    fill: 'rgba(12,16,33,0.26)',
    edge: 'rgba(255,255,255,0.20)',
    chevron: 'rgba(255,255,255,0.78)',
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
