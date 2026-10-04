import { useState } from 'react';
import FeatureInfoDialog from '../../components/common/FeatureInfoDialog';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import Skeleton from '../../components/common/Skeleton';
import StatChip, { type StatChipSize, type StatChipSurface } from '../../components/common/StatChip';
import { azoraScoreIfTodayKept, type AzoraScore } from './domain/azoraScore';
import { radius } from '../../theme/card';

/** Shares the streak flame's illustrated sticker style. */
const SCORE_ICON_SIZE = 28;
const SKELETON_WIDTH = 78;
const SKELETON_HEIGHT = 40;

const AZORA_SCORE_TITLE = 'Azora Score';
const AZORA_SCORE_EXPLAINER =
  'Your Azora Score is your plan-completion rate. It is calculated as: days you completed part of your plan divided by days in the scoring window × 100.\n\nThe scoring window is the last seven days. For example, completing your plan on 5 of 7 days gives you a score of 71. During your first week, it uses only the days since your plan started — completing all 3 days of a new plan gives you 100.\n\nIt measures consistency, not overall progress through the plan. The score can go down when an earlier completed day moves out of the seven-day window.';

interface Props {
  score: AzoraScore | null;
  isLoading: boolean;
  size?: StatChipSize;
  surface?: StatChipSurface;
}

/**
 * The plan's score, in the title row rather than as a card above the path.
 * The card stacked a third block over the first day with the week banner and
 * today's bubble; the number is the part worth keeping in view. What today
 * would make it moves into the explainer the chip opens.
 */
export default function AzoraScoreChip({ score, isLoading, size = 'regular', surface = 'glass' }: Props) {
  const [infoVisible, setInfoVisible] = useState(false);

  if (isLoading || score == null) {
    return (
      <Skeleton
        width={SKELETON_WIDTH}
        height={size === 'compact' ? 30 : SKELETON_HEIGHT}
        radius={size === 'compact' ? radius.medium : radius.large}
      />
    );
  }

  const ifKept = azoraScoreIfTodayKept(score);
  const standing =
    ifKept == null
      ? `${score.daysKept} of ${score.daysAsked} ${score.daysAsked === 1 ? 'day' : 'days'} kept.`
      : `Finish today and your score goes to ${ifKept}.`;

  return (
    <>
      <StatChip
        mark={<TaskIllustration name="azora-score" size={size === 'compact' ? 24 : SCORE_ICON_SIZE} />}
        value={score.score}
        accessibilityLabel={`Azora Score ${score.score}. ${standing}`}
        onPress={() => setInfoVisible(true)}
        size={size}
        surface={surface}
      />
      <FeatureInfoDialog
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title={AZORA_SCORE_TITLE}
        intro={`${standing}\n\n${AZORA_SCORE_EXPLAINER}`}
      />
    </>
  );
}
