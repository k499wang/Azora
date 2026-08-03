import { colors } from '../../../theme/colors';
import type { CharacterId } from '../../../components/home/BlobCharacter';
import type { BreathingTechnique } from './techniques';

export type PlayfulHue = (typeof colors.playful)[keyof typeof colors.playful];

export type GlyphShape = 'rings' | 'orb' | 'arcs' | 'waves' | 'petals' | 'bars';

/**
 * Two art systems on purpose: `character` gives today's three tasks a face, and
 * `glyph` keeps the browsable library a calm systematic grid.
 */
export interface CategoryStyle {
  label: string;
  hue: PlayfulHue;
  glyph: GlyphShape;
  character: CharacterId;
}

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
