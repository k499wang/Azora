import { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import type { IconName } from './Icon';
import { HABIT_ILLUSTRATIONS } from './habitIllustrations';
import { TODO_ILLUSTRATIONS } from './todoIllustrations';
import { SETTINGS_ILLUSTRATIONS } from './settingsIllustrations';
import { SENSE_ILLUSTRATIONS } from './senseIllustrations';
import { stickerIllustrationSvg } from './stickerIllustrationSvg';

interface TaskIllustrationProps {
  name: IconName | keyof typeof HABIT_ILLUSTRATIONS | keyof typeof SETTINGS_ILLUSTRATIONS;
  size?: number;
  done?: boolean;
}

const illustrations: Partial<Record<TaskIllustrationProps['name'], string>> = {
  ...HABIT_ILLUSTRATIONS,
  ...TODO_ILLUSTRATIONS,
  ...SETTINGS_ILLUSTRATIONS,
  ...SENSE_ILLUSTRATIONS,
};

/** One illustration follows a habit through suggestions, picking, and Routine. */
function TaskIllustration({ name, size = 36, done = false }: TaskIllustrationProps) {
  const body = illustrations[name] ?? HABIT_ILLUSTRATIONS.sparkle;
  const xml = stickerIllustrationSvg(body, done ? 0.48 : 1);
  return <SvgXml xml={xml} width={size} height={size} />;
}

export default memo(TaskIllustration);
