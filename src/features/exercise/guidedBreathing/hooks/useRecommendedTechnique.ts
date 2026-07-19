import { useMemo } from 'react';
import TECHNIQUES, { type BreathingTechnique } from '../techniques';
import { useUserDefaultTechniqueQuery } from '../../../../queries/profile/useUserDefaultTechniqueQuery';

const FALLBACK_TECHNIQUE =
  TECHNIQUES.find((technique) => technique.id === 'box') ?? TECHNIQUES[0];

export type RecommendedTechniqueSource = 'profile' | 'fallback';

interface RecommendedTechniqueResolution {
  technique: BreathingTechnique | null;
  source: RecommendedTechniqueSource | null;
  savedTechniqueId: string | null;
}

export function useRecommendedTechnique(userId: string | null): {
  technique: BreathingTechnique | null;
  source: RecommendedTechniqueSource | null;
  isLoading: boolean;
  savedTechniqueId: string | null;
} {
  const defaultTechniqueQuery = useUserDefaultTechniqueQuery(userId);

  const resolved = useMemo<RecommendedTechniqueResolution>(() => {
    if (!defaultTechniqueQuery.isSuccess) {
      return {
        technique: null,
        source: null,
        savedTechniqueId: null,
      };
    }

    const savedTechniqueId = defaultTechniqueQuery.data ?? null;
    const savedTechnique =
      savedTechniqueId == null
        ? null
        : TECHNIQUES.find((technique) => technique.id === savedTechniqueId) ?? null;

    return {
      technique: savedTechnique ?? FALLBACK_TECHNIQUE,
      source: savedTechnique == null ? 'fallback' : 'profile',
      savedTechniqueId,
    };
  }, [defaultTechniqueQuery.data, defaultTechniqueQuery.isSuccess]);

  return {
    ...resolved,
    isLoading: defaultTechniqueQuery.isPending,
  };
}
