import Icon from './icons/Icon';
import StatChip, { type StatChipSize, type StatChipSurface } from './StatChip';
import { colors } from '../../theme/colors';

interface TopBarCoinsProps {
  coins: number;
  size?: StatChipSize;
  surface?: StatChipSurface;
}

export default function TopBarCoins({
  coins,
  size = 'regular',
  surface = 'glass',
}: TopBarCoinsProps) {
  return (
    <StatChip
      mark={
        <Icon
          name="coin"
          size={size === 'compact' ? 22 : 30}
          color={colors.reward.gold}
        />
      }
      value={coins}
      accessibilityLabel={`${coins} coins`}
      size={size}
      surface={surface}
    />
  );
}
