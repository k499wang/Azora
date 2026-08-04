export const HOME_TREE_STAGE_DEFINITIONS = [
  { id: 'seed', label: 'Seed', startsAtCareDays: 0 },
  { id: 'sprout', label: 'Sprout', startsAtCareDays: 1 },
  { id: 'sapling', label: 'Sapling', startsAtCareDays: 4 },
  { id: 'young', label: 'Young tree', startsAtCareDays: 14 },
  { id: 'mature', label: 'Mature tree', startsAtCareDays: 30 },
] as const;

export type GardenTreeStage =
  (typeof HOME_TREE_STAGE_DEFINITIONS)[number]['id'];

export interface HomeTreeProgress {
  careDays: number;
  stage: GardenTreeStage;
  stageLabel: string;
  stageStartsAtCareDays: number;
  nextStage: GardenTreeStage | null;
  nextStageLabel: string | null;
  nextStageStartsAtCareDays: number | null;
  careDaysUntilNextStage: number;
  stageProgress: number;
}

function normalizeCareDays(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function buildHomeTreeProgress(careDayCount: number): HomeTreeProgress {
  const careDays = normalizeCareDays(careDayCount);
  let stageIndex = 0;

  for (let index = 1; index < HOME_TREE_STAGE_DEFINITIONS.length; index += 1) {
    if (careDays < HOME_TREE_STAGE_DEFINITIONS[index].startsAtCareDays) break;
    stageIndex = index;
  }

  const stage = HOME_TREE_STAGE_DEFINITIONS[stageIndex];
  const nextStage = HOME_TREE_STAGE_DEFINITIONS[stageIndex + 1] ?? null;
  const stageSpan = nextStage == null
    ? 0
    : nextStage.startsAtCareDays - stage.startsAtCareDays;
  const progressWithinStage = careDays - stage.startsAtCareDays;

  return {
    careDays,
    stage: stage.id,
    stageLabel: stage.label,
    stageStartsAtCareDays: stage.startsAtCareDays,
    nextStage: nextStage?.id ?? null,
    nextStageLabel: nextStage?.label ?? null,
    nextStageStartsAtCareDays: nextStage?.startsAtCareDays ?? null,
    careDaysUntilNextStage: nextStage == null
      ? 0
      : nextStage.startsAtCareDays - careDays,
    stageProgress: nextStage == null
      ? 1
      : Math.min(1, Math.max(0, progressWithinStage / stageSpan)),
  };
}
