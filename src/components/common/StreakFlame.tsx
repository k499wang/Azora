import { memo } from 'react';
import TaskIllustration from './icons/TaskIllustration';

interface Props {
  size: number;
}

/** Shared streak artwork for milestones and celebrations. */
function StreakFlame({ size }: Props) {
  return <TaskIllustration name="streakFilled" size={size} />;
}

export default memo(StreakFlame);
