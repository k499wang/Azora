import { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import type { IconName } from './Icon';
import { HABIT_ILLUSTRATIONS } from './habitIllustrations';
import { TODO_ILLUSTRATIONS } from './todoIllustrations';

interface TaskIllustrationProps {
  name: IconName | keyof typeof HABIT_ILLUSTRATIONS;
  size?: number;
  done?: boolean;
}

const illustrations: Partial<Record<TaskIllustrationProps['name'], string>> = {
  ...HABIT_ILLUSTRATIONS,
  ...TODO_ILLUSTRATIONS,
};

/** One illustration follows a habit through suggestions, picking, and Routine. */
function TaskIllustration({ name, size = 36, done = false }: TaskIllustrationProps) {
  const body = illustrations[name] ?? HABIT_ILLUSTRATIONS.sparkle;
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><g stroke-linecap="round" stroke-linejoin="round" opacity="${done ? '.48' : '1'}">${body}</g></svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}

export default memo(TaskIllustration);
