import GlassIconButton from '../../components/common/GlassIconButton';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';

interface Props {
  onPress: () => void;
}

export default function RoutineBrowseButton({ onPress }: Props) {
  return (
    <GlassIconButton accessibilityLabel="Browse routines" variant="regular" onPress={onPress}>
      <Icon name="dots-horizontal" size={20} color={colors.text.secondary} />
    </GlassIconButton>
  );
}
