import { getFlowerSpecies, type FlowerSpeciesId } from './flowerSpecies';

export interface FlowerIllustrationProps {
  speciesId: FlowerSpeciesId;
  /** How grown the flower is, 0 (bud) → 1 (full bloom). */
  growth: number;
  /** Square canvas size in points. */
  size: number;
}

/**
 * Single entry point for rendering any registered flower species. UI only needs
 * a species id + growth scalar; the registry decides which parametric SVG
 * renderer draws it. Unknown ids render nothing (the future gamification roll
 * should only ever mint registered ids).
 */
export default function FlowerIllustration({
  speciesId,
  growth,
  size,
}: FlowerIllustrationProps) {
  const species = getFlowerSpecies(speciesId);
  if (species == null) return null;

  const Renderer = species.Renderer;
  return <Renderer growth={growth} size={size} />;
}
