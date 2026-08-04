import { colors } from '../../../theme/colors';
import type { CharacterId } from '../../../components/home/BlobCharacter';
import type { TechniqueId } from './techniqueCatalog';
import type { BreathingTechnique } from './techniques';

export type PlayfulHue = (typeof colors.playful)[keyof typeof colors.playful];

export type GlyphShape =
  | 'rings'
  | 'orb'
  | 'arcs'
  | 'waves'
  | 'petals'
  | 'bars'
  | 'stack'
  | 'prism'
  | 'lattice'
  | 'crescent'
  | 'steps'
  | 'beam'
  | 'chevrons'
  | 'ripple'
  | 'bloom'
  | 'droplet';

/**
 * Two art systems on purpose: `character` gives today's three tasks a face, and
 * `glyph` keeps the browsable library a calm systematic grid. Category `glyph`
 * backs the cards that have no technique behind them (the daily breath hold);
 * library cards use `TECHNIQUE_GLYPH` so a scrolled row never repeats a shape.
 */
export interface CategoryStyle {
  label: string;
  hue: PlayfulHue;
  glyph: GlyphShape;
  character: CharacterId;
}

/**
 * One shape per technique, chosen to echo the exercise: a box for Box
 * Breathing, a descending staircase for Sleep Descent, a bellows sunburst for
 * Bellows Breath. Exhaustive over `TechniqueId` on purpose — a new exercise
 * fails to compile until it gets its own shape, which is what keeps the rows
 * from drifting back into repeats.
 */
export const TECHNIQUE_GLYPH: Record<TechniqueId, GlyphShape> = {
  box: 'stack',
  triangle: 'prism',
  'deep-box': 'lattice',
  '478': 'crescent',
  'night-settle': 'orb',
  'sleep-descent': 'steps',
  wimhof: 'waves',
  bhastrika: 'beam',
  'morning-charge': 'chevrons',
  resonance: 'rings',
  'coherent-6': 'petals',
  relaxing: 'ripple',
  belly: 'bloom',
  'extended-exhale': 'arcs',
  sitali: 'droplet',
};

export const CATEGORY_STYLE: Record<
  BreathingTechnique['category'],
  CategoryStyle
> = {
  calm: {
    label: 'Calm',
    hue: colors.playful.teal,
    glyph: 'rings',
    character: 'calm',
  },
  sleep: {
    label: 'Sleep',
    hue: colors.playful.violet,
    glyph: 'orb',
    character: 'sleep',
  },
  focus: {
    label: 'Focus',
    hue: colors.playful.sky,
    glyph: 'arcs',
    character: 'focus',
  },
  energy: {
    label: 'Energy',
    hue: colors.playful.coral,
    glyph: 'waves',
    character: 'energy',
  },
  balance: {
    label: 'Balance',
    hue: colors.playful.blush,
    glyph: 'petals',
    character: 'balance',
  },
};

// The daily breath hold is not a breathing category, so it carries its own hue.
export const BREATH_HOLD_STYLE: CategoryStyle = {
  label: 'Check-in',
  hue: colors.playful.amber,
  glyph: 'bars',
  character: 'hold',
};
