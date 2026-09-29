import Icon from './icons/Icon';
import StatChip, { type StatChipSize, type StatChipSurface } from './StatChip';
import { colors } from '../../theme/colors';

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
        <Icon
          name="streakFilled"
          size={size === 'compact' ? 22 : 30}
          color={colors.orange[500]}
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
