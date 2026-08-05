import type { ComponentType } from 'react';
import { RoseRenderer } from './species/rose';
import {
  AZORA_FLOWER_DESIGNS,
  createAzoraFlowerRenderer,
} from './species/azoraFlowers';
import { TulipRenderer } from './species/tulip';

/**
 * Shared props contract for every flower species renderer. A renderer is a
 * self-contained illustrated SVG composition (its own ground, stem, bloom…)
 * selected from discrete hand-drawn stages by how grown the flower is.
 */
export interface SpeciesRendererProps {
  /** How grown the flower is, 0 (sprout) → 1 (full bloom). */
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
 * Every registered flower can be rendered through `FlowerIllustration` using
 * only its id and growth scalar. The original rose and tulip remain available
 * for existing garden surfaces; the Azora designs form the collectible set.
 */
export type FlowerSpeciesId =
  | 'rose'
  | 'tulip'
  | (typeof AZORA_FLOWER_DESIGNS)[number]['id'];

type AzoraFlowerId = (typeof AZORA_FLOWER_DESIGNS)[number]['id'];

const AZORA_SPECIES: Record<AzoraFlowerId, FlowerSpecies> = Object.fromEntries(
  AZORA_FLOWER_DESIGNS.map((design) => [
    design.id,
    {
      id: design.id,
      name: design.name,
      Renderer: createAzoraFlowerRenderer(design),
    },
  ]),
) as Record<AzoraFlowerId, FlowerSpecies>;

export const FLOWER_SPECIES: Record<FlowerSpeciesId, FlowerSpecies> = {
  rose: { id: 'rose', name: 'Rose', Renderer: RoseRenderer },
  tulip: { id: 'tulip', name: 'Tulip', Renderer: TulipRenderer },
  ...AZORA_SPECIES,
};

export function getFlowerSpecies(
  speciesId: string,
): FlowerSpecies | null {
  return FLOWER_SPECIES[speciesId as FlowerSpeciesId] ?? null;
}
