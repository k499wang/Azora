/** Deep blue outline used by bordered controls in the room customization UI. */
const INK = '#0B5A87';

export const colors = {
  /** the line weight itself lives in `card.ts`; this is only its colour */
  ink: INK,

  primary: {
    blue100: '#E4F0FF',
    blue200: '#C2DDFF',
    blue300: '#94C6FF',
    blue400: '#63ADFF',
    blue500: '#3D93FF',
    blue600: '#1F7BFF',
    blue700: '#0F62E8',
    blue800: '#0C49B8',
    blue900: '#073388',
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
    100: '#D6FBE4',
    300: '#7BF0AE',
    500: '#16CC65',
    700: '#0E7A3C',
  },

  warning: {
    100: '#FFF2C2',
    300: '#FFE380',
    500: '#FFA800',
    700: '#A85A00',
  },

  error: {
    100: '#FFE0E3',
    300: '#FF9DA4',
    400: '#FF6B78',
    500: '#FF4152',
    700: '#C2102A',
  },

  yellow: {
    100: '#FFF8BC',
    300: '#FFDE33',
    400: '#FFCC00',
    500: '#F2B600',
  },

  orange: {
    100: '#FFF2E0',
    200: '#FFDDB5',
    300: '#FFBA5C',
    400: '#FF9629',
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
  //
  // Every `base` sits at the most chroma the 3:1 white-text floor allows for its
  // hue, so these are as vivid as they can get without white text going soft.
  // Reach for chroma in `soft`/`mid` when a block needs more life — never by
  // lightening a `base`, which trades legibility for it. `ink` clears 4.5:1 on
  // its own `soft`.
  playful: {
    teal: { base: '#06A48C', mid: '#3FC7B0', soft: '#C2F1E7', ink: '#046B5B' },
    coral: { base: '#F0563A', mid: '#FF8567', soft: '#FFD6C9', ink: '#B23A22' },
    violet: {
      base: '#9B4DEC',
      mid: '#B77CF6',
      soft: '#E7D8FB',
      ink: '#6428AE',
    },
    amber: { base: '#CE7A00', mid: '#EDA733', soft: '#FBE5B4', ink: '#8C5300' },
    sky: { base: '#2280F0', mid: '#5EA5F8', soft: '#CCE2FC', ink: '#0F55AA' },
    blush: { base: '#F04593', mid: '#FA7EB4', soft: '#FCD3E6', ink: '#AB1C5F' },
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

  // The room's hex frame is the cut thickness of its walls and floor slab, so
  // it is lit rather than coloured: one tone per face, ordered by how square
  // that face turns to a light sitting above and to the left. Cooler than the
  // walls it wraps, because a cut edge is plaster and the wall is painted.
  //
  // This is the cream the generated `ROOM_SHELL` is cut in. Every shell in
  // `roomShells.ts` derives its own five tones from its own walls, so a themed
  // room never reaches for these.
  roomFrame: {
    /** both wall tops */
    cap: '#F5F1E6',
    baseLeft: '#EEE8D9',
    sideLeft: '#E2DBC8',
    baseRight: '#DCD4BF',
    sideRight: '#CFC6AE',
  },

  // The hex room's resident. A cyan-leaning sky blue keeps him in the app's blue
  // family while staying clear of the primary azure the UI accents use, so he
  // reads as a character rather than furniture against the warm cream floor.
  roomBlob: {
    body: '#46BCF5',
    bodyLight: '#7FD6FA',
    foot: '#2497DB',
    face: '#12384B',
    // the pop of sparkles when the blob is poked
    sparkle: '#FFCE3D',
    // Mochi's friendly blush; warm against the sky blue so the small cheeks
    // read as colour rather than another highlight
    cheek: '#FF7C6A',
    // matches the shadow ink the room artwork already uses
    shadow: 'rgba(58,67,79,0.22)',
    // the clipboard he takes notes on — warm wood against his sky blue
    board: '#C08A54',
    boardEdge: '#8A5A2E',
  },

  background: {
    // Cool off-white canvas for the frosted/glass paradigm — a shade deeper than
    // `canvas` so sheets and modals seat below the page they cover.
    primary: '#F3F5F9',
    // Warm cream canvas the playful color blocks and white cards sit on. `card.base`
    // is borderless by design, so this gap to `background.card` is the only thing
    // separating a card from the page — never take it to pure white.
    canvas: '#FDF6F0',
    secondary: '#E6F1FF',
    elevated: '#FFFFFF',
    // Cards are a warm white, not a pure one: on the cream canvas pure #FFFFFF
    // read as a brighter, cooler material than the page rather than a surface
    // lifted off it. This keeps the same hue as the canvas and only lightens it,
    // so the card still reads as the brightest thing on screen. Every card
    // surface uses this so the app has one card white, not two that are nearly
    // the same.
    card: '#FFFCF9',
    // Outlined surfaces that sit directly on `canvas` — lighter than the canvas so
    // each row reads as its own surface, still short of `card` so a bordered row
    // never competes with a real elevated card.
    cardSoft: '#F8FAFD',
    accentSoft: '#E4F0FF',
    // Blue block behind the top bar, curving into the page canvas.
    headerTint: '#63ADFF',
    // Warm cream for paper/letter surfaces.
    paper: '#FBF7EF',
    // Translucent dark panel for a card sitting on the meadow: it darkens the
    // field behind it instead of punching a white hole in it, so the card is
    // still the scene, read in `text.inverse`.
    cardScrim: 'rgba(30,40,32,0.22)',
    // The flat green the home meadow artwork ends on, so the page carries that
    // same field down past the artwork with no seam.
    meadow: '#83B85D',
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
    scrim: 'rgba(241,243,248,0.94)',
    lockedScrim: '#F1F3F8',
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
  },

  // The middle step of the three-level surface system: white card, very light
  // tint, saturated accent. These are the tint level — full card backgrounds for
  // category, selected, or special content, where a border would otherwise go.
  // Never use a `playful.*.soft` as a card fill; it belongs on badges and fills.
  surface: {
    welcome: '#FAF6F0',
    /** selected / primary card */
    selected: '#EDF5FF',
    teal: '#E4FBF5',
    coral: '#FFEFE9',
    violet: '#F6EDFF',
    amber: '#FFF6DF',
    sky: '#E9F3FF',
    blush: '#FFEDF5',
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
    brand: '#1367E8',
  },

  border: {
    subtle: '#E2E8F0',
    default: '#CBD5E1',
    strong: '#94A3B8',
    brand: '#63ADFF',
  },

  // Blue-grey shadow ink for card lift — warmer than neutral[900], so a card's
  // depth reads as soft light rather than a grey smudge.
  shadowInk: '#37485C',

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

  // Currency and streak colours for the reward loop. Used on coin/flame
  // iconography and counters — not a general accent family.
  reward: {
    gold: '#FFC53D',
    flame: '#FF7A3D',
  },

  // Illustration-only palette for the room and outdoor scenes. Never use these
  // in UI chrome — they exist so artwork shares one world, not one theme.
  scene: {
    sky: '#A9DDF7',
    grass: '#7CC98D',
    grassDeep: '#5FAE73',
    cloud: '#E8F6FD',
    roomWall: '#FFF3DC',
  },

  mood: {
    stressed: '#FF9F1C',
    anxious: '#8B5CFF',
    sleepless: '#4A5FE0',
    focus: '#3B88FF',
    angry: '#FF4A54',
    lowEnergy: '#FF7A2F',
  },

  // Loading placeholder tones. `base` is the resting block fill, `highlight`
  // the lighter sweep used by the shimmer gradient.
  skeleton: {
    base: '#E2E8F0',
    highlight: '#FFFFFF',
  },
} as const;
