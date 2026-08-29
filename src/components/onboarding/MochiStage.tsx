import { forwardRef, useEffect, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import RoomBlob, { type RoomBlobHandle } from '../../features/room/RoomBlob';
import { ROOM_ASPECT } from '../../features/room/RoomScene';
import { triggerBounceHaptic } from '../../native/tapHaptics';
import { duration, easing, travel } from '../../theme/motion';
import { getMochiStageWidth } from './mochiStageSize';

/** a beat behind the screen transition, so the room lands into a settled page */
const ENTER_DELAY_MS = 90;

export { getMochiStageWidth };


interface MochiStageProps {
  /** the room artwork this sizes itself to; must be rendered at `width` */
  children: ReactNode;
  accessibilityLabel: string;
  onPress?: () => void;
  /** a line for the blob to say, opening on mount and on every poke */
  speech?: string;
  /** whether the blob is slumped and staying put */
  sad?: boolean;
  /** disable when the child owns the entrance for the whole stage */
  animateEntrance?: boolean;
}

/**
 * The room plus its resident, filling the body of a story screen.
 *
 * The onboarding story beats all show the same room the Home tab shows, so they
 * use the same wandering `RoomBlob` rather than the static portrait — the blob
 * a user meets here is the one they poke on Home.
 */
const MochiStage = forwardRef<RoomBlobHandle, MochiStageProps>(
  function MochiStage(
    {
      children,
      accessibilityLabel,
      onPress,
      speech,
      sad,
      animateEntrance = true,
    },
    ref,
  ) {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const width = getMochiStageWidth(screenWidth, screenHeight);

    // The room arrives rather than appearing. Reanimated, so it runs on the UI
    // thread alongside the blob instead of competing with it for JS frames.
    const enter = useSharedValue(animateEntrance ? 0 : 1);

    useEffect(() => {
      if (!animateEntrance) {
        enter.value = 1;
        return () => cancelAnimation(enter);
      }

      enter.value = withDelay(
        ENTER_DELAY_MS,
        withTiming(1, { duration: duration.slow, easing: easing.settle }),
      );

      return () => cancelAnimation(enter);
    }, [animateEntrance, enter]);

    const enterStyle = useAnimatedStyle(() => ({
      opacity: enter.value,
      transform: [
        { translateY: (1 - enter.value) * travel.rise },
        { scale: 0.94 + enter.value * 0.06 },
      ],
    }));

    return (
      <View style={styles.frame}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={() => {
            triggerBounceHaptic();
            onPress?.();
          }}
        >
          <Animated.View
            style={[{ width, height: width * ROOM_ASPECT }, enterStyle]}
          >
            {children}
            <RoomBlob ref={ref} width={width} speech={speech} sad={sad} />
          </Animated.View>
        </Pressable>
      </View>
    );
  },
);

export default MochiStage;

const styles = StyleSheet.create({
  // The layout's centerBody/centerOnScreen puts this on the true middle of the
  // phone, measured from the header and footer rather than from the copy above
  // it — so the room sits centred *and* lands in the same place on every beat,
  // however many lines the title runs to.
  frame: {
    alignItems: 'center',
  },
});
