import { Pressable } from 'react-native';
import Icon from '../../components/common/icons/Icon';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';

interface Props {
  onPress: () => void;
}

export default function RoutineBrowseButton({ onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Browse routines"
      hitSlop={spacing.sm}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => pressed && pressable.control}
    >
      <Icon name="grid-plus" size={28} color={colors.text.secondary} />
    </Pressable>
  );
}
