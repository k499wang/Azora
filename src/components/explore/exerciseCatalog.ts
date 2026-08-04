import TECHNIQUES, {
  type BreathingTechnique,
} from '../../features/exercise/guidedBreathing/techniques';
import {
  matchesExerciseSearch,
  normalizeExerciseSearch,
} from '../../lib/exerciseSearch';

export type ExerciseGroupId = BreathingTechnique['category'];
export type ExerciseSearchFilter =
  | 'all'
  | BreathingTechnique['category']
  | 'breath-hold';

export interface ExerciseGroup {
  id: ExerciseGroupId;
  title: string;
  techniques: BreathingTechnique[];
}

const CATEGORY_SEARCH_TERMS: Record<
  BreathingTechnique['category'],
  readonly string[]
> = {
  calm: ['Calm', 'Reduce Stress & Unwind', 'Sleep & Calm'],
  sleep: ['Sleep', 'Fall Asleep Easier', 'Sleep & Calm'],
  focus: ['Focus', 'Improve Your Focus', 'Focus & Energy'],
  energy: ['Energy', 'Boost Your Energy', 'Focus & Energy'],
  balance: [
    'Balance',
    'Coherence',
    'Build Inner Coherence',
    'Find Your Balance',
  ],
};

const EXERCISE_GROUPS: ReadonlyArray<{
  id: ExerciseGroupId;
  title: string;
}> = [
  { id: 'calm', title: 'Reduce Stress & Unwind' },
  { id: 'sleep', title: 'Fall Asleep Easier' },
  { id: 'focus', title: 'Improve Your Focus' },
  { id: 'energy', title: 'Boost Your Energy' },
  { id: 'balance', title: 'Build Inner Coherence' },
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
      (technique) => technique.category === group.id,
    ),
  }));
}

export function searchExerciseCatalog(
  searchQuery: string,
  recommendedTechniqueId: string | null,
  filter: ExerciseSearchFilter = 'all',
): BreathingTechnique[] {
  if (filter === 'breath-hold') return [];

  const normalizedQuery = normalizeExerciseSearch(searchQuery);
  if (normalizedQuery.length === 0 && filter === 'all') return [];

  return getOrderedTechniques(recommendedTechniqueId).filter((technique) => {
    if (filter !== 'all' && technique.category !== filter) return false;
    if (normalizedQuery.length === 0) return true;

    return matchesExerciseSearch(normalizedQuery, [
      technique.name,
      ...CATEGORY_SEARCH_TERMS[technique.category],
    ]);
  });
}
