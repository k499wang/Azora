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

export interface ExploreShelf {
  id: 'for-you' | 'popular';
  title: string;
  techniques: BreathingTechnique[];
}

/** Explore shows two shelves; the rest of the catalog lives behind search. */
const SHELF_LENGTH = 5;

/**
 * The best-known techniques, in the order a newcomer meets them. Fixed rather
 * than derived: with no usage counts to rank by, a "Popular" shelf that
 * reshuffles is just noise.
 */
const POPULAR_TECHNIQUE_IDS: readonly string[] = [
  'box',
  '478',
  'wimhof',
  'resonance',
  'belly',
];

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

/**
 * `For you` leads with the recommended technique and fills from its own
 * category first, so the shelf reads as one answer rather than a sample of the
 * whole catalog.
 */
function getForYouTechniques(
  recommendedTechniqueId: string | null,
): BreathingTechnique[] {
  const recommended =
    recommendedTechniqueId == null
      ? null
      : TECHNIQUES.find(
          (technique) => technique.id === recommendedTechniqueId,
        ) ?? null;

  if (recommended == null) return TECHNIQUES.slice(0, SHELF_LENGTH);

  const sameCategory = TECHNIQUES.filter(
    (technique) =>
      technique.id !== recommended.id &&
      technique.category === recommended.category,
  );
  const rest = TECHNIQUES.filter(
    (technique) =>
      technique.id !== recommended.id &&
      technique.category !== recommended.category,
  );

  return [recommended, ...sameCategory, ...rest].slice(0, SHELF_LENGTH);
}

export function getExploreShelves(
  recommendedTechniqueId: string | null,
): ExploreShelf[] {
  const popular = POPULAR_TECHNIQUE_IDS.map((id) =>
    TECHNIQUES.find((technique) => technique.id === id),
  ).filter((technique): technique is BreathingTechnique => technique != null);

  return [
    {
      id: 'for-you',
      title: 'For you',
      techniques: getForYouTechniques(recommendedTechniqueId),
    },
    { id: 'popular', title: 'Popular', techniques: popular },
  ];
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
