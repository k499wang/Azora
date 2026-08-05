import type { ComponentType } from 'react';
import { RoseRenderer } from './species/rose';
import { TulipRenderer } from './species/tulip';

/**
 * Shared props contract for every flower species renderer. A renderer is a
 * self-contained parametric SVG illustration (its own ground, stem, bloom…)
 * driven only by how grown the flower is.
 */
export interface SpeciesRendererProps {
  /** How grown the flower is, 0 (seed/bud) → 1 (full bloom). */
  growth: number;
  /** Canvas size in points — the renderer draws to a square of this size. */
  size: number;
}

export interface FlowerSpecies {
  id: FlowerSpeciesId;
  name: string;
  Renderer: ComponentType<SpeciesRendererProps>;
}

/**
 * Adding a new flower = one id here + one entry below + one renderer file in
 * `./species`. Nothing else in the app needs to change; `FlowerIllustration`
 * dispatches purely by id. Rarity/unlock fields can be added to this shape
 * when the gamification roll lands.
 */
export type FlowerSpeciesId = 'rose' | 'tulip';

export const FLOWER_SPECIES: Record<FlowerSpeciesId, FlowerSpecies> = {
  rose: { id: 'rose', name: 'Rose', Renderer: RoseRenderer },
  tulip: { id: 'tulip', name: 'Tulip', Renderer: TulipRenderer },
};

export function getFlowerSpecies(
  speciesId: string,
): FlowerSpecies | null {
  return FLOWER_SPECIES[speciesId as FlowerSpeciesId] ?? null;
}
