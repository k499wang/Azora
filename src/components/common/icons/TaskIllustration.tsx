import { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import type { IconName } from './Icon';
import { HABIT_ILLUSTRATIONS } from './habitIllustrations';
import { TODO_ILLUSTRATIONS } from './todoIllustrations';
import { SETTINGS_ILLUSTRATIONS } from './settingsIllustrations';
import { SENSE_ILLUSTRATIONS } from './senseIllustrations';
import { MUSCLE_ILLUSTRATIONS, type MuscleIllustrationName } from './muscleIllustrations';
import { HEART_RATE_ILLUSTRATIONS } from './heartRateIllustrations';
import { stickerIllustrationSvg } from './stickerIllustrationSvg';
import { colors } from '../../../theme/colors';

interface TaskIllustrationProps {
  name: IconName | keyof typeof HABIT_ILLUSTRATIONS | keyof typeof SETTINGS_ILLUSTRATIONS | keyof typeof HEART_RATE_ILLUSTRATIONS | MuscleIllustrationName;
  size?: number;
  done?: boolean;
  /** a flat grey silhouette, for something not yet earned */
  locked?: boolean;
}

const illustrations: Partial<Record<TaskIllustrationProps['name'], string>> = {
  ...HABIT_ILLUSTRATIONS,
  ...TODO_ILLUSTRATIONS,
  ...SETTINGS_ILLUSTRATIONS,
  ...SENSE_ILLUSTRATIONS,
  ...MUSCLE_ILLUSTRATIONS,
  ...HEART_RATE_ILLUSTRATIONS,
  streakFilled: HABIT_ILLUSTRATIONS.streak,
};

/** One illustration follows a habit through suggestions, picking, and Routine. */
const LOCKED_OPACITY = 0.35;

function silhouette(body: string): string {
  const grey = colors.neutral[400];
  return body
    .replace(/fill="(?!none")[^"]*"/g, `fill="${grey}"`)
    .replace(/stroke="(?!none")[^"]*"/g, `stroke="${grey}"`);
}

function TaskIllustration({ name, size = 36, done = false, locked = false }: TaskIllustrationProps) {
  const body = illustrations[name] ?? HABIT_ILLUSTRATIONS.sparkle;
  const xml = locked
    ? stickerIllustrationSvg(silhouette(body), LOCKED_OPACITY)
    : stickerIllustrationSvg(body, done ? 0.48 : 1);
  return <SvgXml xml={xml} width={size} height={size} />;
}

export default memo(TaskIllustration);
