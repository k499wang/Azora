import type { ComponentProps } from 'react';
import type { GlyphShape } from '../../features/exercise/guidedBreathing/categoryPalette';
import TaskIllustration from '../common/icons/TaskIllustration';

type ActivityIllustrationProps = {
  shape: GlyphShape;
  size: number;
};

const illustrationNames: Record<GlyphShape, ComponentProps<typeof TaskIllustration>['name']> = {
  rings: 'wind',
  orb: 'moon',
  arcs: 'breath-leaf',
  waves: 'waves',
  petals: 'lotus',
  bars: 'dumbbell',
  stack: 'breath-box',
  prism: 'sparkle',
  lattice: 'snowflake',
  crescent: 'bed-clock',
  steps: 'walk',
  beam: 'sun',
  chevrons: 'sunrise',
  ripple: 'meditation',
  bloom: 'heart',
  droplet: 'glass',
};

export default function ActivityIllustration({ shape, size }: ActivityIllustrationProps) {
  return <TaskIllustration name={illustrationNames[shape]} size={size} />;
}
