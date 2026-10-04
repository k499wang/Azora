import TaskIllustration from './icons/TaskIllustration';
import StatChip, { type StatChipSize, type StatChipSurface } from './StatChip';

interface TopBarStreakProps {
  streakDays: number;
  onPress?: () => void;
  size?: StatChipSize;
  surface?: StatChipSurface;
}

export default function TopBarStreak({
  streakDays,
  onPress,
  size = 'regular',
  surface = 'glass',
}: TopBarStreakProps) {
  return (
    <StatChip
      mark={
        <TaskIllustration
          name="streakFilled"
          size={size === 'compact' ? 24 : 30}
        />
      }
      value={streakDays}
      accessibilityLabel={`${streakDays} day streak`}
      onPress={onPress}
      size={size}
      surface={surface}
    />
  );
}
