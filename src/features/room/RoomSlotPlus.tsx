import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from '../../components/common/icons/Icon';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { slotAnchor } from './roomStage';
import { ROOM_ASPECT } from './RoomScene';
import { colors } from '../../theme/colors';
import { easing } from '../../theme/motion';
import type { RoomSlot } from '../../lib/room/roomProgress';

const BUTTON_SIZE = 52;
const HALO_SIZE = BUTTON_SIZE + 16;
const PULSE_MS = 1100;
const PULSE_REST_MS = 700;

interface RoomSlotPlusProps {
  /** the width the room is drawn at — the overlay registers on it exactly */
  roomWidth: number;
  slot: RoomSlot;
  disabled?: boolean;
  onPress: () => void;
}

/**
 * The empty slot, standing in the room where its piece will go.
 *
 * The room is the picker now: instead of reading a list and imagining where
 * the thing lands, you tap the gap it fills. It sits at `slotAnchor`, so it
 * tracks the artwork rather than a hand-placed coordinate, and it pulses
 * because a room with one tappable spot has to say which spot that is.
 */
export default function RoomSlotPlus({
  roomWidth,
  slot,
  disabled = false,
  onPress,
}: RoomSlotPlusProps) {
  const pulse = useSharedValue(0);

  useWhileVisible(() => {
    pulse.value = 0;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: PULSE_MS, easing: easing.burst }),
        withDelay(PULSE_REST_MS, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );

    return () => cancelAnimation(pulse);
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: (1 - pulse.value) * 0.5,
    transform: [{ scale: 1 + pulse.value * 0.6 }],
  }));

  const anchor = slotAnchor(slot);
  if (anchor == null) {
    return null;
  }

  const roomHeight = roomWidth * ROOM_ASPECT;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.spot,
        {
          left: anchor.x * roomWidth - BUTTON_SIZE / 2,
          top: anchor.y * roomHeight - BUTTON_SIZE / 2,
        },
      ]}
    >
      <Animated.View pointerEvents="none" style={[styles.halo, haloStyle]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add today's piece"
        disabled={disabled}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onPress}
      >
        <Icon name="plus" size={26} color={colors.text.inverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  spot: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    backgroundColor: colors.primary.blue400,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue600,
    borderWidth: 3,
    borderColor: colors.neutral[0],
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonPressed: {
    transform: [{ scale: 0.92 }],
  },
});
