import TECHNIQUES, {
  type BreathingTechnique,
} from '../../features/exercise/guidedBreathing/techniques';
import { CATEGORY_STYLE } from '../../features/exercise/guidedBreathing/categoryPalette';
import {
  matchesExerciseSearch,
  normalizeExerciseSearch,
} from '../../lib/exerciseSearch';

export type ExerciseGroupId = 'sleep-calm' | 'mental-reset' | 'focus-energy';

export interface ExerciseGroup {
  id: ExerciseGroupId;
  title: string;
  techniques: BreathingTechnique[];
}

const CATEGORY_GROUP: Record<BreathingTechnique['category'], ExerciseGroupId> = {
  sleep: 'sleep-calm',
  calm: 'sleep-calm',
  balance: 'mental-reset',
  focus: 'focus-energy',
  energy: 'focus-energy',
};

const EXERCISE_GROUPS: ReadonlyArray<{
  id: ExerciseGroupId;
  title: string;
}> = [
  { id: 'sleep-calm', title: 'Sleep & Calm' },
  { id: 'focus-energy', title: 'Focus & Energy' },
  { id: 'mental-reset', title: 'Find Your Balance' },
];

export function getOrderedTechniques(
  recommendedTechniqueId: string | null,
): BreathingTechnique[] {
  if (recommendedTechniqueId == null) return TECHNIQUES;
  const recommended = TECHNIQUES.find(
    (technique) => technique.id === recommendedTechniqueId,
  );
  if (recommended == null) return TECHNIQUES;

  return [
    recommended,
    ...TECHNIQUES.filter((technique) => technique.id !== recommendedTechniqueId),
  ];
}

export function getBrowseExerciseGroups(
  recommendedTechniqueId: string | null,
): ExerciseGroup[] {
  const orderedTechniques = getOrderedTechniques(recommendedTechniqueId);

  return EXERCISE_GROUPS.map((group) => ({
    ...group,
    techniques: orderedTechniques.filter(
      (technique) => CATEGORY_GROUP[technique.category] === group.id,
    ),
  }));
}

export function searchExerciseCatalog(
  searchQuery: string,
  recommendedTechniqueId: string | null,
): BreathingTechnique[] {
  const normalizedQuery = normalizeExerciseSearch(searchQuery);
  if (normalizedQuery.length === 0) return [];

  return getOrderedTechniques(recommendedTechniqueId).filter((technique) => {
    const group = EXERCISE_GROUPS.find(
      (candidate) => candidate.id === CATEGORY_GROUP[technique.category],
    );

    return matchesExerciseSearch(normalizedQuery, [
      technique.name,
      CATEGORY_STYLE[technique.category].label,
      group?.title ?? '',
    ]);
  });
}
