import { Pressable, StyleSheet } from 'react-native';
import Icon from '../../components/common/icons/Icon';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';

const BUTTON_SIZE = 36;

interface Props {
  onPress: () => void;
}

export default function RoutineBrowseButton({ onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Browse routines"
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [card.base, styles.button, pressed && pressable.control]}
    >
      <Icon name="dots-horizontal" size={20} color={colors.text.secondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
