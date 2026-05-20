import { useMemo } from 'react';
import ArcActionMenu, { type ArcAction } from './ArcActionMenu';
import { colors } from '../../theme/colors';
import type { BreathingTechnique } from '../../data/techniques';
import type { IconName } from './icons/Icon';

export type BreatheActionId = 'daily' | 'breathe' | 'measure';

interface Props {
  visible: boolean;
  anchorBottomOffset?: number;
  anchorHorizontalAlign?: 'center' | 'right' | 'left';
  onClose: () => void;
  onSelect: (id: BreatheActionId) => void;
  recommendedTechnique: BreathingTechnique | null;
  isRecommendedTechniqueLoading?: boolean;
}

const CATEGORY_ICON: Record<BreathingTechnique['category'], IconName> = {
  calm: 'meditation',
  focus: 'waves',
  energy: 'sparkle',
  sleep: 'moon',
  balance: 'waves',
};

function formatPattern(pattern: BreathingTechnique['pattern']): string {
  return [pattern.inhale, pattern.holdIn, pattern.exhale, pattern.holdOut]
    .filter((v) => v > 0)
    .join('-');
}

/**
 * BreatheArcMenu
 *
 * Domain-specific wrapper around ArcActionMenu. Converts the user's
 * recommended breathing technique into the generic action shape and
 * wires up the three primary actions: Daily plan, Breathe, Measure.
 *
 * Keeps all breath-hold business logic out of the presentational layer.
 */
export default function BreatheArcMenu({
  visible,
  anchorBottomOffset = 120,
  anchorHorizontalAlign = 'center',
  onClose,
  onSelect,
  recommendedTechnique,
  isRecommendedTechniqueLoading = false,
}: Props) {
  const actions = useMemo<ArcAction[]>(() => {
    const breatheAction: ArcAction =
      recommendedTechnique == null
        ? {
            id: 'breathe',
            title: 'Breathe',
            subtitle: isRecommendedTechniqueLoading
              ? 'Loading plan'
              : 'Plan unavailable',
            icon: 'meditation',
            color: colors.neutral[400],
            disabled: true,
          }
        : {
            id: 'breathe',
            title: 'Breathe',
            subtitle: formatPattern(recommendedTechnique.pattern),
            icon: CATEGORY_ICON[recommendedTechnique.category],
            color: colors.orange[500],
          };

    return [
      {
        id: 'daily',
        title: 'Daily plan',
        subtitle: "Today's session",
        icon: 'meditation',
        color: colors.primary.blue600,
      },
      breatheAction,
      {
        id: 'measure',
        title: 'Measure',
        subtitle: 'Heart rate',
        icon: 'heart',
        color: colors.error[500],
      },
    ];
  }, [isRecommendedTechniqueLoading, recommendedTechnique]);

  return (
    <ArcActionMenu
      visible={visible}
      anchorBottomOffset={anchorBottomOffset}
      anchorHorizontalAlign={anchorHorizontalAlign}
      actions={actions}
      onClose={onClose}
      onSelect={(id) => onSelect(id as BreatheActionId)}
    />
  );
}
