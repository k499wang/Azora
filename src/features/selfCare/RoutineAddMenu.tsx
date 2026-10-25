import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from '../../components/common/icons/Icon';
import PopupMenu from '../../components/common/PopupMenu';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { useTourTarget } from '../tour/tourTargets';

export const ROUTINE_ADD_BUTTON_SIZE = 60;

interface Props {
  onPlanWithAzo: () => void;
  onBrainDump: () => void;
  onAddHabit: () => void;
}

/** The floating add button; its menu offers Azo's chat, a spoken brain dump, or a to-do of your own. */
export default function RoutineAddMenu({ onPlanWithAzo, onBrainDump, onAddHabit }: Props) {
  const tourTarget = useTourTarget('routineAddHabit');

  return (
    <View {...tourTarget}>
      <PopupMenu
        accessibilityLabel="Add to routine"
        placement="above"
        items={[
          {
            label: 'Plan with Azo',
            icon: 'ai-sparkles',
            iconColor: colors.primary.blue500,
            iconBackground: colors.playful.sky.soft,
            onPress: onPlanWithAzo,
          },
          {
            label: 'Brain dump',
            icon: 'microphone',
            iconColor: colors.playful.violet.base,
            iconBackground: colors.playful.violet.soft,
            onPress: onBrainDump,
          },
          {
            label: 'Add my own',
            icon: 'pencil',
            iconColor: colors.playful.coral.base,
            iconBackground: colors.playful.coral.soft,
            onPress: onAddHabit,
          },
        ]}
      >
        {(open) => (
          <View style={[card.shadowBrand, styles.button]}>
            <TurningPlus open={open} />
          </View>
        )}
      </PopupMenu>
    </View>
  );
}

/** Turns an eighth to become the menu's close mark while it is open. */
function TurningPlus({ open }: { open: boolean }) {
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.value = withTiming(open ? 1 : 0, { duration: duration.base, easing: easing.settle });
  }, [open, turn]);
  const turnStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 45}deg` }],
  }));

  return (
    <Animated.View style={turnStyle}>
      <Icon bold name="plus" size={28} color={colors.text.inverse} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: ROUTINE_ADD_BUTTON_SIZE,
    height: ROUTINE_ADD_BUTTON_SIZE,
    borderRadius: ROUTINE_ADD_BUTTON_SIZE / 2,
    backgroundColor: colors.primary.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
